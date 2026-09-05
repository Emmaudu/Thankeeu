/**
 * asArray — the guard that stops one malformed API response white-screening a
 * page.
 *
 * `res.data || []` guards null and undefined only. An OBJECT response passes
 * straight through it and the next `.map()` throws, which in React unmounts
 * the tree and shows a blank page. That has happened twice in this codebase:
 * the notification bell taking down every dashboard page, and three dashboard
 * pages caught by the route smoke test.
 */
import { describe, it, expect } from 'vitest';
import { asArray } from '../utils/asArray';

describe('asArray', () => {
  it('passes an array straight through, same reference', () => {
    const a = [1, 2, 3];
    expect(asArray(a)).toBe(a);
  });

  it('returns an empty array for the nullish cases the old idiom handled', () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
    expect(asArray('')).toEqual([]);
    expect(asArray(0)).toEqual([]);
  });

  // The whole point: these used to reach .map() and blank the page.
  it('returns an empty array for the objects that used to crash the page', () => {
    expect(asArray({ error: 'Unauthorized' })).toEqual([]);
    expect(asArray({ message: 'Server error' })).toEqual([]);
    expect(asArray({})).toEqual([]);
    expect(asArray('a string')).toEqual([]);
    expect(asArray(42)).toEqual([]);
    expect(asArray(true)).toEqual([]);
  });

  it('unwraps a paginated envelope rather than discarding the rows', () => {
    expect(asArray({ items:   [1, 2] })).toEqual([1, 2]);
    expect(asArray({ data:    [3] })).toEqual([3]);
    expect(asArray({ rows:    [4] })).toEqual([4]);
    expect(asArray({ results: [5] })).toEqual([5]);
    expect(asArray({ cards:   [6] })).toEqual([6]);
    expect(asArray({ records: [7] })).toEqual([7]);
    expect(asArray({ list:    [8] })).toEqual([8]);
  });

  it('ignores an envelope key that is not itself an array', () => {
    expect(asArray({ items: 'nope' })).toEqual([]);
    expect(asArray({ data: { nested: true } })).toEqual([]);
  });

  it('prefers the first envelope key it finds, deterministically', () => {
    expect(asArray({ items: [1], data: [2] })).toEqual([1]);
  });

  it('never throws, whatever it is handed', () => {
    const nasty = [null, undefined, NaN, Symbol('x'), () => {}, new Date(), /re/, new Map()];
    nasty.forEach(v => expect(() => asArray(v)).not.toThrow());
  });

  it('always returns something safe to .map() over', () => {
    [null, {}, 'x', 7, { error: 'e' }, [], { items: [1] }]
      .forEach(v => expect(() => asArray(v).map(x => x)).not.toThrow());
  });
});
