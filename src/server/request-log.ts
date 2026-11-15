let apiRequestsTotal = 0;

export function incrementApiRequests(): void {
  apiRequestsTotal += 1;
}

export function getApiRequestsTotal(): number {
  return apiRequestsTotal;
}

/** Texto de exposição Prometheus (Projeto B); compatível com scrape local no compose dev. */
export function renderPrometheusMetricsText(): string {
  const total = getApiRequestsTotal();
  return [
    '# HELP api_requests_total Requisições /api/* atendidas neste processo (zera ao reiniciar).',
    '# TYPE api_requests_total counter',
    `api_requests_total ${total}`,
    '',
  ].join('\n');
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
