import { describe, expect, it, vi, beforeEach } from 'vitest';

const poolQuery = vi.hoisted(() => vi.fn());
const clientQuery = vi.fn();
const connect = vi.fn(async () => ({
  query: clientQuery,
  release: vi.fn(),
}));

vi.mock('pg', () => {
  class Pool {
    connect = connect;
    on = vi.fn();
    query = poolQuery;
  }
  return { default: { Pool } };
});

import { createPgCompatSql } from './pg-neon-compat';

describe('createPgCompatSql transaction', () => {
  beforeEach(() => {
    clientQuery.mockReset();
    connect.mockClear();
    poolQuery.mockReset();
    poolQuery.mockResolvedValue({ rows: [] });
    clientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ theme: 'dark' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
  });

  it('returns row arrays for each query in order', async () => {
    const sql = createPgCompatSql('postgresql://local/test');
    const results = await sql.transaction([
      sql`select set_config('app.user_id', ${'user-1'}, true)`,
      sql`select theme from settings where user_id = ${'user-1'}`,
      sql`select id from installment_plans`,
    ]);

    expect(results).toHaveLength(3);
    expect(results[1]).toEqual([{ theme: 'dark' }]);
    expect(clientQuery).toHaveBeenCalledWith('BEGIN');
    expect(clientQuery).toHaveBeenCalledWith('COMMIT');
  });
});