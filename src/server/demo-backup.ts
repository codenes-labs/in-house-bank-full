import { APP_DATA_BACKUP_VERSION, type AppDataBackup } from '../domain/models/app-data-backup';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import { DefaultInterestType } from '../domain/enums/default-interest-type';
import { InstallmentPlanType } from '../domain/enums/installment-plan-type';

export const DEMO_PLAN_ID = 'a1000000-0000-4000-8000-000000000001';
export const DEMO_INSTALLMENT_1_ID = 'a2000000-0000-4000-8000-000000000001';
export const DEMO_INSTALLMENT_2_ID = 'a2000000-0000-4000-8000-000000000002';
export const DEMO_CASH_BOX_ID = 'a3000000-0000-4000-8000-000000000001';
export const DEMO_MOVEMENT_ID = 'a4000000-0000-4000-8000-000000000001';

export function createDemoAppBackup(): AppDataBackup {
  return {
    version: APP_DATA_BACKUP_VERSION,
    settings: {
      businessName: 'Demo In House Bank',
      document: '00.000.000/0001-91',
      city: 'São Paulo',
      defaultPixKey: '11999999999',
      defaultInstitution: 'Caixinha Demo',
      defaultInstallments: 4,
      defaultDueDay: 10,
      defaultInterestType: DefaultInterestType.Simple,
      theme: 'light',
      cdiAnnualPercent: 13.15,
      milestonesCents: [100_000, 500_000, 1_000_000],
      freeBalanceCents: 250_000,
      pdfFooterText: 'Dados fictícios para demonstração.',
      paymentInstructions: 'Pix copia e cola gerado só para treino.',
      whatsappMessageTemplate: 'Olá! Segue a cobrança de demonstração.',
    },
    installmentPlans: [
      {
        id: DEMO_PLAN_ID,
        type: InstallmentPlanType.Loan,
        reference: 'DEMO-001',
        borrowerName: 'Cliente Fictício',
        usedAmountCents: 54_000,
        returnAmountCents: 60_480,
        issueDate: '2026-01-15',
        firstDueDate: '2026-02-10',
        installmentsCount: 2,
        pixKey: '11999999999',
        beneficiary: 'Demo In House Bank',
        institution: 'Caixinha Demo',
        payerPhone: '11999999999',
        createdAt: '2026-01-15T12:00:00.000Z',
      },
    ],
    installments: [
      {
        id: DEMO_INSTALLMENT_1_ID,
        planId: DEMO_PLAN_ID,
        number: 1,
        dueDate: '2026-02-10',
        amountCents: 30_240,
        txid: 'DEMOTXID001',
      },
      {
        id: DEMO_INSTALLMENT_2_ID,
        planId: DEMO_PLAN_ID,
        number: 2,
        dueDate: '2026-03-10',
        amountCents: 30_240,
        paidDate: '2026-03-05',
        txid: 'DEMOTXID002',
      },
    ],
    cashBoxes: [
      {
        id: DEMO_CASH_BOX_ID,
        name: 'Caixinha Demo',
        institution: 'Banco Fictício',
        cdiPercent: 100,
        limitCents: 500_000,
        balanceCents: 320_000,
      },
    ],
    cashBoxMovements: [
      {
        id: DEMO_MOVEMENT_ID,
        cashBoxId: DEMO_CASH_BOX_ID,
        type: CashBoxMovementType.Deposit,
        amountCents: 100_000,
        date: '2026-01-10',
        note: 'Aporte inicial de demonstração',
      },
    ],
  };
}
