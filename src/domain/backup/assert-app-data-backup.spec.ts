import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import { APP_DATA_BACKUP_VERSION } from '../models/app-data-backup';
import { assertAppDataBackup, parseAppDataBackupJson } from './assert-app-data-backup';

describe('assertAppDataBackup', () => {
  const validBackup = {
    version: APP_DATA_BACKUP_VERSION,
    settings: createEmptySettings(),
    installmentPlans: [],
    installments: [],
    cashBoxes: [],
    cashBoxMovements: [],
    freeBalanceWithdrawals: [],
    freeBalanceDeposits: [],
  };

  it('accepts a valid backup shape', () => {
    expect(assertAppDataBackup(validBackup)).toEqual(validBackup);
  });

  it('fills missing freeBalanceWithdrawals for version 1 backups', () => {
    const legacy = { ...validBackup };
    delete (legacy as { freeBalanceWithdrawals?: unknown }).freeBalanceWithdrawals;
    expect(assertAppDataBackup(legacy).freeBalanceWithdrawals).toEqual([]);
  });

  it('fills missing freeBalanceDeposits for version 1 backups', () => {
    const legacy = { ...validBackup };
    delete (legacy as { freeBalanceDeposits?: unknown }).freeBalanceDeposits;
    expect(assertAppDataBackup(legacy).freeBalanceDeposits).toEqual([]);
  });

  it('rejects unsupported versions and malformed payloads', () => {
    expect(() => assertAppDataBackup({ ...validBackup, version: 2 })).toThrow();
    expect(() => assertAppDataBackup(null)).toThrow();
    expect(() => assertAppDataBackup({ ...validBackup, installments: {} })).toThrow();
  });
});

describe('parseAppDataBackupJson', () => {
  it('parses JSON strings', () => {
    const backup = {
      version: APP_DATA_BACKUP_VERSION,
      settings: createEmptySettings(),
      installmentPlans: [],
      installments: [],
      cashBoxes: [],
      cashBoxMovements: [],
      freeBalanceWithdrawals: [],
      freeBalanceDeposits: [],
    };

    expect(parseAppDataBackupJson(JSON.stringify(backup))).toEqual(backup);
  });
});
