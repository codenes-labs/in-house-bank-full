import { describe, expect, it } from 'vitest';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { createEmptySettings } from '../models/settings';
import { APP_DATA_BACKUP_VERSION } from '../models/app-data-backup';
import { removeCashBoxMovementsFromBackup } from './remove-cash-box-movements-from-backup';

describe('removeCashBoxMovementsFromBackup', () => {
  it('drops matching movements and reverses balance on cash boxes', () => {
    const cashBoxId = '338ca190-0ffe-4432-9adb-72f6e17c6ffa';
    const backup = {
      version: APP_DATA_BACKUP_VERSION,
      settings: createEmptySettings(),
      installmentPlans: [],
      installments: [],
      cashBoxes: [
        {
          id: cashBoxId,
          name: 'Caixinha Turbo',
          institution: 'Nubank',
          cdiPercent: 115,
          limitCents: 500_000,
          balanceCents: 360_761,
        },
      ],
      cashBoxMovements: [
        {
          id: 'test-movement',
          cashBoxId,
          type: CashBoxMovementType.Deposit,
          amountCents: 90_000,
          date: '2026-11-06',
          note: '30% Salario Teste',
        },
      ],
      freeBalanceWithdrawals: [],
    };

    const cleaned = removeCashBoxMovementsFromBackup(
      backup,
      (movement) => movement.note === '30% Salario Teste',
    );

    expect(cleaned.cashBoxMovements).toEqual([]);
    expect(cleaned.cashBoxes[0]?.balanceCents).toBe(270_761);
  });
});
