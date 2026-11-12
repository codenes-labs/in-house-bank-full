let apiRequestsTotal = 0;

export function incrementApiRequests(): void {
  apiRequestsTotal += 1;
}

export function getApiRequestsTotal(): number {
  return apiRequestsTotal;
}

/** Somente testes — contador é global por isolate/processo. */
export function resetApiMetricsForTests(): void {
  apiRequestsTotal = 0;
}

export type ApiRequestLogFields = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
};

export function logApiRequest(fields: ApiRequestLogFields): void {
  const payload = {
    time: new Date().toISOString(),
    level: 'info',
    method: fields.method,
    path: fields.path,
    status: fields.status,
    durationMs: fields.durationMs,
  };
  console.log(JSON.stringify(payload));
}
