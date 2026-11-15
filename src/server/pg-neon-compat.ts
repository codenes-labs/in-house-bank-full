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

export function createPgCompatSql(connectionString: string): Sql {
  const pool = new pg.Pool({ connectionString });
  pool.on('error', (cause) => {
    console.error('[pg pool]', cause instanceof Error ? cause.message : String(cause));
  });
  const sql = makeTemplateTag(pool) as Sql;
  sql.unsafe = (raw: string) => raw;

  sql.query = ((queryText: string, params?: unknown[]) => {
    return buildTaggedQuery(pool, queryText, params ?? []);
  }) as Sql['query'];

  sql.transaction = async (queriesOrFn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txnSql = makeTemplateTag(pool, client) as Sql;
      txnSql.unsafe = (raw: string) => raw;
      txnSql.query = ((queryText: string, params?: unknown[]) =>
        buildTaggedQuery(pool, queryText, params ?? [], client)) as Sql['query'];

      const pendingList =
        typeof queriesOrFn === 'function' ? queriesOrFn(txnSql) : queriesOrFn;
      const queries = Array.isArray(pendingList) ? pendingList : [pendingList];
      const results: Row[][] = [];
      for (const item of queries) {
        if (isPendingPgQuery(item)) {
          results.push(await item._runOnClient(client));
        } else {
          results.push(await item);
        }
      }
      await client.query('COMMIT');
      return results;
    } catch (cause) {
      await client.query('ROLLBACK');
      throw cause;
    } finally {
      client.release();
    }
  };

  return sql;
}