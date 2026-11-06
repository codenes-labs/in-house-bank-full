import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261105120000_init.sql'),
  'utf8',
);

const tables = [
  'settings',
  'installment_plans',
  'installments',
  'cash_boxes',
  'cash_box_movements',
];

describe('row level security migration', () => {
  it('enables RLS and owner policies on every table', () => {
    for (const table of tables) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      if (table !== 'settings') {
        expect(sql).toContain(`create index ${table}_user_id_idx`);
      }
      for (const action of ['select', 'insert', 'update', 'delete']) {
        expect(sql).toContain(`${table}_${action}_own`);
      }
    }
    expect(sql.match(/auth\.uid\(\) = user_id/g)?.length).toBeGreaterThanOrEqual(tables.length * 4);
  });
});
