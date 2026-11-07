import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument, OPENAPI_VERSION } from './openapi-document';

describe('buildOpenApiDocument', () => {
  it('exposes every HTTP route group', () => {
    const doc = buildOpenApiDocument();
    expect(doc['openapi']).toBe(OPENAPI_VERSION);
    const paths = doc['paths'] as Record<string, Record<string, unknown>>;
    expect(paths['/api/health']?.get).toBeDefined();
    expect(paths['/api/auth/sign-in']?.post).toBeDefined();
    expect(paths['/api/bank']?.get).toBeDefined();
    expect(paths['/api/bank/free-balance-withdrawals']?.put).toBeDefined();
  });
});
