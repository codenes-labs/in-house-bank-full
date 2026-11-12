export type CaptchaGate = 'ready' | 'wait' | 'unavailable';

/** Missing invisible-captcha token means wait for the challenge, not a form error. */
export function captchaGate(input: { required: boolean; token: string | null; failed: boolean }): CaptchaGate {
  if (!input.required || input.token) {
    return 'ready';
  }
  if (input.failed) {
    return 'unavailable';
  }
  return 'wait';
}
