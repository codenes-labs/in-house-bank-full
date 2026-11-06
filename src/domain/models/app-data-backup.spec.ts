import { describe, expect, it } from 'vitest';
import { APP_DATA_BACKUP_VERSION } from './app-data-backup';

describe('APP_DATA_BACKUP_VERSION', () => {
  it('starts at version 1 for Etapa 1 exports', () => {
    expect(APP_DATA_BACKUP_VERSION).toBe(1);
  });
});
