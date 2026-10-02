import { describe, it, expect } from 'vitest';
import { marketFromPath, getMarket, cpath, switchMarketPath, formatMoney, prefixOf } from '../utils/market';
import { marketFromTimeZone } from '../components/layout/GeoSuggest';
import COUNTRY_INDEX from '../content/countries/index';

describe('markets', () => {
  it('reads the market from the URL', () => {
    expect(marketFromPath('/uk/tasks').code).toBe('GB');
    expect(marketFromPath('/new-zealand').code).toBe('NZ');
    expect(marketFromPath('/tasks').code).toBe('NG');
    expect(marketFromPath('/ukraine').code).toBe('NG');
  });
  it('builds links inside a market', () => {
    expect(cpath('/tasks', getMarket('uk'))).toBe('/uk/tasks');
    expect(cpath('/', getMarket('GB'))).toBe('/uk');
    expect(cpath('/tasks', getMarket('NG'))).toBe('/tasks');
    expect(prefixOf('SG')).toBe('/singapore');
    expect(prefixOf('NG')).toBe('');
  });
  it('switches the same page between markets', () => {
    expect(switchMarketPath('/uk/tasks', 'US')).toBe('/us/tasks');
    expect(switchMarketPath('/tasks', 'canada')).toBe('/canada/tasks');
    expect(switchMarketPath('/ireland/tasks', 'NG')).toBe('/tasks');
  });
  it('formats money per currency, Naira unchanged', () => {
    expect(formatMoney(12500, 'NGN')).toBe('₦12,500');
    expect(formatMoney(12.5, 'GBP')).toBe('£12.50');
    expect(formatMoney(40, 'USD')).toBe('$40');
    expect(formatMoney(1200, 'AUD')).toBe('A$1,200');
    expect(formatMoney(9.99, 'EUR')).toBe('€9.99');
  });
  it('maps time zones to country sites and leaves others alone', () => {
    expect(marketFromTimeZone('Europe/London')).toBe('GB');
    expect(marketFromTimeZone('Europe/Dublin')).toBe('IE');
    expect(marketFromTimeZone('America/Toronto')).toBe('CA');
    expect(marketFromTimeZone('America/Chicago')).toBe('US');
    expect(marketFromTimeZone('America/Indiana/Indianapolis')).toBe('US');
    expect(marketFromTimeZone('Australia/Perth')).toBe('AU');
    expect(marketFromTimeZone('Pacific/Auckland')).toBe('NZ');
    expect(marketFromTimeZone('Asia/Singapore')).toBe('SG');
    expect(marketFromTimeZone('Africa/Lagos')).toBe(null);
    expect(marketFromTimeZone('America/Sao_Paulo')).toBe(null);
  });
  it('every country has 8 services, 12+ cities and 4 comparisons with unique slugs', () => {
    for (const [slug, c] of Object.entries(COUNTRY_INDEX)) {
      expect(c.services.length, slug).toBe(8);
      expect(c.cities.length, slug).toBeGreaterThanOrEqual(12);
      expect(c.compare.length, slug).toBe(4);
      const all = [...c.cities.map(x => x.slug)];
      expect(new Set(all).size, slug).toBe(all.length);
      for (const reserved of ['tasks', 'post-task', 'requester', 'tasker', 'remote', 'services', 'compare', 'auth', 'taskers', 'signup', 'login', 'become-a-tasker']) {
        expect(all.includes(reserved), `${slug} city slug ${reserved}`).toBe(false);
      }
    }
  });
});
