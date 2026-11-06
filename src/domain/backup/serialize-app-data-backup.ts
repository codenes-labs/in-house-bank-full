import type { AppDataBackup } from '../models/app-data-backup';

export function serializeAppDataBackup(backup: AppDataBackup): string {
  return JSON.stringify(backup, null, 2);
}
