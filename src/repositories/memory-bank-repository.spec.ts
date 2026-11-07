import { describe, expect, it } from 'vitest';
import { APP_DATA_BACKUP_VERSION } from '../domain/models/app-data-backup';
import { createEmptySettings } from '../domain/models/settings';
import { createMemoryBankRepository } from './memory-bank-repository';

describe('createMemoryBankRepository', () => {
  it('replaces the snapshot on backup import without mixing previous rows', async () => {
    const repository = createMemoryBankRepository();
    await repository.savePlan({
      id: 'old',
      type: 'LOAN',
      reference: 'Antigo',
      borrowerName: 'Ana',
      usedAmountCents: 100,
      returnAmountCents: 110,
      issueDate: '2026-01-01',
      firstDueDate: '2026-02-01',
      installmentsCount: 1,
      pixKey: 'a@b.com',
      beneficiary: 'Casa',
      institution: 'Banco',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await repository.importBackup({
      version: APP_DATA_BACKUP_VERSION,
      settings: { ...createEmptySettings(), businessName: 'Nova' },
      installmentPlans: [],
      installments: [],
      cashBoxes: [],
      cashBoxMovements: [],
    });

    const snapshot = await repository.load();
    expect(snapshot.installmentPlans).toEqual([]);
    expect(snapshot.settings.businessName).toBe('Nova');
  });

  it('transfers cash box balance to free balance when deleting the box', async () => {
    const repository = createMemoryBankRepository();
    await repository.saveSettings({ ...createEmptySettings(), freeBalanceCents: 1_000_00 });
    await repository.saveCashBox({
      id: 'box-1',
      name: 'Reserva',
      institution: 'Banco',
      cdiPercent: 100,
      balanceCents: 500_00,
    });

    await repository.deleteCashBox('box-1');

    const snapshot = await repository.load();
    expect(snapshot.cashBoxes).toEqual([]);
    expect(snapshot.settings.freeBalanceCents).toBe(1_500_00);
  });
});
