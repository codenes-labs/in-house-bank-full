import pg from 'pg';
import type { NeonQueryFunction } from '@neondatabase/serverless';

type Sql = NeonQueryFunction<false, false>;
type Row = Record<string, unknown>;

type PendingPgQuery = Promise<Row[]> & {
  _runOnClient: (client: pg.PoolClient) => Promise<Row[]>;
};

function buildTaggedQuery(
  pool: pg.Pool,
  text: string,
  values: unknown[],
  client?: pg.PoolClient,
): PendingPgQuery {
  const runOnClient = async (runner: pg.PoolClient): Promise<Row[]> => {
    const result = await runner.query(text, values);
    return result.rows as Row[];
  };
  const base = client
    ? runOnClient(client)
    : pool.query(text, values).then((result) => result.rows as Row[]);
  return Object.assign(base, { _runOnClient: runOnClient });
}

function isPendingPgQuery(value: unknown): value is PendingPgQuery {
  return typeof value === 'object' && value !== null && '_runOnClient' in value;
}

function makeTemplateTag(pool: pg.Pool, client?: pg.PoolClient) {
  return (strings: TemplateStringsArray, ...values: unknown[]): PendingPgQuery => {
    let text = strings[0] ?? '';
    for (let index = 0; index < values.length; index++) {
      text += `$${index + 1}` + (strings[index + 1] ?? '');
    }
    return buildTaggedQuery(pool, text, values, client);
  };
}

function attachSqlMethods(pool: pg.Pool, tagged: ReturnType<typeof makeTemplateTag>, client?: pg.PoolClient): Sql {
  const sql = tagged as unknown as Sql;
  sql.unsafe = ((raw: string) => raw) as unknown as Sql['unsafe'];
  sql.query = ((queryText: string, params?: unknown[]) =>
    buildTaggedQuery(pool, queryText, params ?? [], client)) as unknown as Sql['query'];
  return sql;
}

export function createPgCompatSql(connectionString: string): Sql {
  const pool = new pg.Pool({ connectionString });
  pool.on('error', (cause) => {
    console.error('[pg pool]', cause instanceof Error ? cause.message : String(cause));
  });
  const sql = attachSqlMethods(pool, makeTemplateTag(pool));

  sql.transaction = (async (
    queriesOrFn: Parameters<Sql['transaction']>[0],
  ) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txnSql = attachSqlMethods(pool, makeTemplateTag(pool, client), client);
      const pendingList =
        typeof queriesOrFn === 'function'
          ? (queriesOrFn as (innerSql: Sql) => unknown)(txnSql)
          : queriesOrFn;
      const queries = Array.isArray(pendingList) ? pendingList : [pendingList];
      const results: Row[][] = [];
      for (const item of queries) {
        if (isPendingPgQuery(item)) {
          results.push(await item._runOnClient(client));
        } else {
          results.push((await item) as unknown as Row[]);
        }
      }
      await client.query('COMMIT');
      return results as unknown as Awaited<ReturnType<Sql['transaction']>>;
    } catch (cause) {
      await client.query('ROLLBACK');
      throw cause;
    } finally {
      client.release();
    }
  }) as unknown as Sql['transaction'];

  return sql;
}