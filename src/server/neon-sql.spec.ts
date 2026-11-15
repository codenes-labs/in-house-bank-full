import { describe, expect, it, vi } from 'vitest';
import { createSql, isLocalPostgresDatabaseUrl, normalizeDatabaseUrl } from './neon-sql';

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
}));

describe('normalizeDatabaseUrl', () => {
  it('removes channel_binding from the query string', () => {
    const url = normalizeDatabaseUrl('postgres://u:p@h/db?channel_binding=require&sslmode=require');
    expect(url).not.toContain('channel_binding');
    expect(url).toContain('sslmode=require');
  });
});

describe('isLocalPostgresDatabaseUrl', () => {
  it('detects compose service hostname db', () => {
    expect(isLocalPostgresDatabaseUrl('postgresql://inhouse:inhouse@db:5432/inhouse')).toBe(true);
  });

  it('treats remote Neon host as non-local', () => {
    expect(isLocalPostgresDatabaseUrl('postgresql://u:p@ep-cool-name.aws.neon.tech/neondb')).toBe(false);
  });
});

describe('createSql', () => {
  it('uses the neon driver for remote hosts', async () => {
    const { neon } = await import('@neondatabase/serverless');
    createSql('postgresql://u:p@ep-example.neon.tech/neondb');
    expect(neon).toHaveBeenCalled();
  });
});