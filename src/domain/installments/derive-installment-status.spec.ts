import { describe, expect, it } from 'vitest';
import { InstallmentStatus } from '../enums/installment-status';
import { deriveInstallmentStatus } from './derive-installment-status';

describe('deriveInstallmentStatus', () => {
  it('returns PAID when paidDate is set', () => {
    expect(
      deriveInstallmentStatus({ dueDate: '2026-01-01', paidDate: '2026-01-10' }, '2026-10-16'),
    ).toBe(InstallmentStatus.Paid);
  });

  it('returns OVERDUE when pending and dueDate is before today', () => {
    expect(deriveInstallmentStatus({ dueDate: '2026-10-01' }, '2026-10-16')).toBe(
      InstallmentStatus.Overdue,
    );
  });

  it('returns PENDING when pending and dueDate is today or later', () => {
    expect(deriveInstallmentStatus({ dueDate: '2026-10-16' }, '2026-10-16')).toBe(
      InstallmentStatus.Pending,
    );
    expect(deriveInstallmentStatus({ dueDate: '2026-11-01' }, '2026-10-16')).toBe(
      InstallmentStatus.Pending,
    );
  });
});
