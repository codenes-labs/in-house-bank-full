export function readAccessTokenExpMs(token: string): number | null {
  const segment = token.split('.')[1];
  if (!segment) {
    return null;
  }
  try {
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=');
    const body = JSON.parse(atob(padded)) as { exp?: number };
    return typeof body.exp === 'number' ? body.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, nowMs = Date.now()): boolean {
  const expMs = readAccessTokenExpMs(token);
  if (expMs === null) {
    return true;
  }
  return expMs <= nowMs;
}
