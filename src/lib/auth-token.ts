const ACCESS_TOKEN_KEY = 'in-house-bank.accessToken';

export function readAccessToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function writeAccessToken(token: string | null): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function authRequestInit(init: RequestInit = {}): RequestInit {
  const token = readAccessToken();
  if (!token) {
    return init;
  }
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  return { ...init, headers };
}
