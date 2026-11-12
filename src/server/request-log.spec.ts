import { describe, expect, it } from 'vitest';
import { getApiRequestsTotal, incrementApiRequests, logApiRequest, resetApiMetricsForTests } from './request-log';

describe('request-log', () => {
  it('increments api_requests_total', () => {
    resetApiMetricsForTests();
    incrementApiRequests();
    incrementApiRequests();
    expect(getApiRequestsTotal()).toBe(2);
  });

  it('logApiRequest prints JSON without secrets', () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (line: unknown) => {
      lines.push(String(line));
    };
    try {
      logApiRequest({ method: 'GET', path: '/api/health', status: 200, durationMs: 3 });
      expect(lines).toHaveLength(1);
      const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
      expect(parsed).toMatchObject({
        level: 'info',
        method: 'GET',
        path: '/api/health',
        status: 200,
        durationMs: 3,
      });
      expect(parsed['time']).toBeTypeOf('string');
      expect(JSON.stringify(parsed)).not.toMatch(/DATABASE_URL|JWT_SECRET|Bearer/i);
    } finally {
      console.log = original;
    }
  });
});
