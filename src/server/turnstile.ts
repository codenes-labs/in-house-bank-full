export async function verifyTurnstileToken(
  secret: string | undefined,
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const trimmedSecret = secret?.trim();
  if (!trimmedSecret) {
    return true;
  }
  if (!token?.trim()) {
    return false;
  }
  const body = new URLSearchParams({
    secret: trimmedSecret,
    response: token.trim(),
  });
  if (remoteIp?.trim()) {
    body.set('remoteip', remoteIp.trim());
  }
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    return false;
  }
  const payload = (await response.json()) as { success?: boolean };
  return payload.success === true;
}
