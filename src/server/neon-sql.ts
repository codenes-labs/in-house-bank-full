import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export type Sql = NeonQueryFunction<false, false>;

const LOCAL_PG_HOSTS = new Set(['db', 'localhost', '127.0.0.1', 'postgres']);

export function isLocalPostgresDatabaseUrl(databaseUrl: string): boolean {
  try {
    return LOCAL_PG_HOSTS.has(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}

export function createSql(databaseUrl: string): Sql {
  return neon(normalizeDatabaseUrl(databaseUrl));
}

export function normalizeDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.delete('channel_binding');
  return url.toString();
}