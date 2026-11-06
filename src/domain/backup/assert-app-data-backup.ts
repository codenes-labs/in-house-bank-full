import { APP_DATA_BACKUP_VERSION, type AppDataBackup } from '../models/app-data-backup';

export function parseAppDataBackupJson(json: string): AppDataBackup {
  return assertAppDataBackup(JSON.parse(json) as unknown);
}

export function assertAppDataBackup(value: unknown): AppDataBackup {
  if (!value || typeof value !== 'object') {
    throw new Error('Backup must be a JSON object');
  }

  const backup = value as Record<string, unknown>;

  if (backup['version'] !== APP_DATA_BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(backup['version'])}`);
  }

  if (!backup['settings'] || typeof backup['settings'] !== 'object') {
    throw new Error('Backup settings must be an object');
  }

  assertArray(backup['installmentPlans'], 'installmentPlans');
  assertArray(backup['installments'], 'installments');
  assertArray(backup['cashBoxes'], 'cashBoxes');
  assertArray(backup['cashBoxMovements'], 'cashBoxMovements');

  return backup as unknown as AppDataBackup;
}

function assertArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`Backup ${field} must be an array`);
  }
}
