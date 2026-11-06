const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' } as const;

export interface AccessTokenClaims {
  userId: string;
  email: string;
}

export async function signAccessToken(
  options: { secret: string; expiresInSeconds: number },
  claims: AccessTokenClaims,
): Promise<string> {
  assertSecret(options.secret);
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeJson({
    sub: claims.userId,
    email: claims.email,
    iat: now,
    exp: now + options.expiresInSeconds,
  });
  const signature = await sign(`${header}.${payload}`, options.secret);
  return `${header}.${payload}.${signature}`;
}

export async function verifyAccessToken(secret: string, token: string): Promise<AccessTokenClaims> {
  assertSecret(secret);
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token inválido.');
  }
  const [header, payload, signature] = parts as [string, string, string];
  const expected = await sign(`${header}.${payload}`, secret);
  if (!safeEqual(signature, expected)) {
    throw new Error('Token inválido.');
  }
  const body = decodeJson(payload) as { sub?: string; email?: string; exp?: number };
  if (!body.sub || !body.email || typeof body.exp !== 'number') {
    throw new Error('Token inválido.');
  }
  if (body.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado.');
  }
  return { userId: body.sub, email: body.email };
}

async function sign(content: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), ALGORITHM, false, ['sign']);
  const digest = await crypto.subtle.sign(ALGORITHM, key, new TextEncoder().encode(content));
  return bytesToBase64Url(new Uint8Array(digest));
}

function encodeJson(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson(segment: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function assertSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
  }
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
