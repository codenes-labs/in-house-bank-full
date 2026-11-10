export const DEMO_PERSISTENCE_ERROR =
  'Conta de demonstração: alterações não são gravadas no banco. Ao entrar de novo, os dados voltam ao exemplo.';

/** Demo may read bank data; mutations under /api/bank must not hit Postgres. */
export function rejectsDemoPersistence(isDemo: boolean, method: string, pathname: string): boolean {
  if (!isDemo) {
    return false;
  }
  if (method === 'GET' || method === 'HEAD') {
    return false;
  }
  return pathname.startsWith('/api/bank');
}
