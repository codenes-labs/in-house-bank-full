import { describe, expect, it } from 'vitest';
import { schemaStatements } from './schema';

const tables = [
  'settings',
  'installment_plans',
  'installments',
  'cash_boxes',
  'cash_box_movements',
];

const sql = schemaStatements.join('\n');

describe('Neon isolation schema', () => {
  it('forces row level security on every data table', () => {
    for (const table of tables) {
      expect(sql).toContain(`alter table public.${table} force row level security`);
      expect(sql).toContain(`references public.users (id)`);
      if (table !== 'settings') {
        expect(sql).toContain(`create index if not exists ${table}_user_id_idx`);
      }
      for (const action of ['select', 'insert', 'update', 'delete']) {
        expect(sql).toContain(`${table}_${action}_own`);
      }
    }
    expect(sql.match(/app\.user_id/g)?.length).toBeGreaterThanOrEqual(tables.length * 4);
    expect(sql).not.toContain('auth.users');
    expect(sql).not.toContain('auth.uid()');
  });
});
