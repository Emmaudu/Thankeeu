import { describe, it, expect } from 'vitest';
import { formatCurrency, formatLocalPrice } from '../utils/currency';

describe('local prices never look like dollars', () => {
  it('peso style currencies show their code, whole numbers', () => {
    const cop = formatLocalPrice(7000, 'COP');
    expect(cop).toMatch(/^COP \d[\d,]*$/);
    expect(formatLocalPrice(7000, 'MUR')).toMatch(/^(MUR \d[\d,]*|Rs\s?[\d,]+)$/);
  });
  it('currencies with their own symbol keep it; USD stays dollars', () => {
    expect(formatLocalPrice(7000, 'GBP')).toBe(formatCurrency(7000, 'GBP'));
    expect(formatLocalPrice(7000, 'EUR')).toBe(formatCurrency(7000, 'EUR'));
    expect(formatLocalPrice(7000, 'USD')).toBe(formatCurrency(7000, 'USD'));
    expect(formatLocalPrice(7000, 'AUD')).not.toMatch(/^\$/);
  });
});
