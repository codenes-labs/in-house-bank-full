import { createApiHandler, type ApiHandlerOptions } from './create-api-handler';
import { isLocalPostgresDatabaseUrl } from './neon-sql';
import { createPgCompatSql } from './pg-neon-compat';

export function createViteDevApiHandler(options: ApiHandlerOptions) {
  const databaseUrl = options.databaseUrl?.trim();
  if (databaseUrl && isLocalPostgresDatabaseUrl(databaseUrl)) {
    return createApiHandler({
      ...options,
      devSql: createPgCompatSql(databaseUrl),
    });
  }
  return createApiHandler(options);
}