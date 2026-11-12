import { describe, expect, it } from 'vitest';
import { captchaGate } from './auth-captcha-gate';

describe('captchaGate', () => {
  it('lets the form proceed when captcha is off or the token is ready', () => {
    expect(captchaGate({ required: false, token: null, failed: false })).toBe('ready');
    expect(captchaGate({ required: true, token: 'token', failed: false })).toBe('ready');
  });

  it('waits instead of failing while the invisible challenge is still running', () => {
    expect(captchaGate({ required: true, token: null, failed: false })).toBe('wait');
  });

  it('reports unavailable only after the widget failed', () => {
    expect(captchaGate({ required: true, token: null, failed: true })).toBe('unavailable');
  });
});
