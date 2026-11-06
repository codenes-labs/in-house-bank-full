import { describe, expect, it } from 'vitest';
import { buildInstallmentTxid } from './build-installment-txid';
import { refreshPendingInstallmentTxids } from './refresh-pending-installment-txids';
import { InstallmentPlanType } from '../enums/installment-plan-type';

describe('refreshPendingInstallmentTxids', () => {
  it('rebuilds pending codes and leaves paid installments untouched', () => {
    const planId = '11111111-1111-4111-8111-111111111111';
    const result = refreshPendingInstallmentTxids(
      {
        id: planId,
        type: InstallmentPlanType.Loan,
        reference: 'Ref',
        borrowerName: 'Ana',
        usedAmountCents: 100,
        returnAmountCents: 110,
        issueDate: '2026-01-01',
        firstDueDate: '2026-02-01',
        installmentsCount: 2,
        pixKey: 'a@b.com',
        beneficiary: 'Casa',
        institution: 'Banco',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      [
        {
          id: 'a',
          planId,
          number: 1,
          dueDate: '2026-02-01',
          amountCents: 50,
          paidDate: '2026-02-02',
          txid: 'pago-antigo',
        },
        {
          id: 'b',
          planId,
          number: 2,
          dueDate: '2026-03-01',
          amountCents: 60,
          txid: 'pendente-antigo',
        },
      ],
    );

    expect(result[0]?.txid).toBe('pago-antigo');
    expect(result[1]?.txid).toBe(buildInstallmentTxid(planId, 2));
  });
});
