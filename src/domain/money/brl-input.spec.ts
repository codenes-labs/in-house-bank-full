import { describe, expect, it } from 'vitest';
import { brlStringToCents, formatCentsAsBrl } from './brl-input';

describe('brlStringToCents', () => {
  it('parses pt-BR currency strings', () => {
    expect(brlStringToCents('1.234,56')).toBe(123_456);
    expect(brlStringToCents('540,00')).toBe(54_000);
    expect(brlStringToCents('invalid')).toBeNull();
  });
});

describe('formatCentsAsBrl', () => {
  it('formats cents for display', () => {
    expect(formatCentsAsBrl(14975)).toBe('149,75');
  });
});
