import { describe, expect, it } from 'vitest';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
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
      freeBalanceWithdrawals: [],
      freeBalanceDeposits: [],
    });

    const snapshot = await repository.load();
    expect(snapshot.installmentPlans).toEqual([]);
    expect(snapshot.settings.businessName).toBe('Nova');
  });

  it('keeps cash box balance when saving box and movement in the same repository session', async () => {
    const repository = createMemoryBankRepository();
    await repository.saveCashBox({
      id: 'box-1',
      name: 'Viagem',
      institution: 'Demo',
      cdiPercent: 110,
      balanceCents: 950_00,
      limitCents: 300_000,
    });
    await repository.saveCashBox({
      id: 'box-1',
      name: 'Viagem',
      institution: 'Demo',
      cdiPercent: 110,
      balanceCents: 1_263_13,
      limitCents: 300_000,
    });
    await repository.saveMovement({
      id: 'm1',
      cashBoxId: 'box-1',
      type: CashBoxMovementType.Deposit,
      amountCents: 313_13,
      date: '2026-03-20',
    });

    const snapshot = await repository.load();
    expect(snapshot.cashBoxes[0]?.balanceCents).toBe(1_263_13);
    expect(snapshot.cashBoxMovements).toHaveLength(1);
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
    expect(snapshot.freeBalanceDeposits).toEqual([
      expect.objectContaining({
        amountCents: 500_00,
        note: 'Resgate da caixinha Reserva',
      }),
    ]);
  });

  it('records a free balance deposit and updates settings together', async () => {
    const repository = createMemoryBankRepository();
    const settings = { ...createEmptySettings(), freeBalanceCents: 20_000 };
    await repository.saveSettings(settings);
    await repository.saveFreeBalanceDeposit(
      { id: 'd1', amountCents: 5_000, date: '2026-11-07' },
      { ...settings, freeBalanceCents: 25_000 },
    );

    const snapshot = await repository.load();
    expect(snapshot.settings.freeBalanceCents).toBe(25_000);
    expect(snapshot.freeBalanceDeposits).toEqual([
      { id: 'd1', amountCents: 5_000, date: '2026-11-07' },
    ]);
  });

  it('records a free balance withdrawal and updates settings together', async () => {
    const repository = createMemoryBankRepository();
    const settings = { ...createEmptySettings(), freeBalanceCents: 20_000 };
    await repository.saveSettings(settings);
    await repository.saveFreeBalanceWithdrawal(
      { id: 'w1', amountCents: 5_000, date: '2026-11-07' },
      { ...settings, freeBalanceCents: 15_000 },
    );

    const snapshot = await repository.load();
    expect(snapshot.settings.freeBalanceCents).toBe(15_000);
    expect(snapshot.freeBalanceWithdrawals).toEqual([
      { id: 'w1', amountCents: 5_000, date: '2026-11-07' },
    ]);
  });
});
