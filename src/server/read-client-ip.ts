export function readClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip')?.trim();
  if (cf) {
    return cf;
  }
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
