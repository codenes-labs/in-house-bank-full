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
  };

  it('accepts a valid backup shape', () => {
    expect(assertAppDataBackup(validBackup)).toEqual(validBackup);
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
    };

    expect(parseAppDataBackupJson(JSON.stringify(backup))).toEqual(backup);
  });
});
