import { describe, expect, it } from 'vitest';
import data from '../../worker/puzzles.json';
import type { Puzzle } from '../../src/lib/types';
import { parOf } from '../../src/lib/types';
import { LAUNCH_DATE, isTodaySomewhere, parseDateKey, puzzleForDate, puzzleNumber } from '../../worker/puzzles';
import { distancesTo, lettersChanged } from '../../src/lib/ladder';
import { VALID } from '../../src/lib/words';
import { puzzle } from './fixtures';

const PUZZLES = data as Puzzle[];
const at = (key: string, hour = 0) => parseDateKey(key)! + hour * 3_600_000;

describe('parseDateKey', () => {
  it('reads a valid key as UTC midnight', () => {
    expect(parseDateKey('2026-10-27')).toBe(Date.UTC(2026, 9, 27));
  });

  it.each(['2026-13-01', '2026-02-30', '2026-1-1', 'yesterday', ''])('rejects %s', (key) => {
    expect(parseDateKey(key)).toBeNull();
  });
});

describe('puzzleNumber', () => {
  it('is 1 on the launch date', () => {
    expect(puzzleNumber(parseDateKey(LAUNCH_DATE)!)).toBe(1);
  });

  it('counts on by whole days across a DST boundary', () => {
    expect(puzzleNumber(parseDateKey('2026-11-03')!)).toBe(8);
  });

  it('is 0 or less before launch', () => {
    expect(puzzleNumber(parseDateKey('2026-10-26')!)).toBe(0);
  });
});

describe('isTodaySomewhere', () => {
  const date = parseDateKey('2026-10-27')!;

  it('opens 14 hours early, for UTC+14', () => {
    expect(isTodaySomewhere(date, at('2026-10-26', 10) - 1)).toBe(false);
    expect(isTodaySomewhere(date, at('2026-10-26', 10))).toBe(true);
  });

  it('closes 12 hours late, for UTC−12', () => {
    expect(isTodaySomewhere(date, at('2026-10-28', 12) - 1)).toBe(true);
    expect(isTodaySomewhere(date, at('2026-10-28', 12))).toBe(false);
  });
});

describe('puzzleForDate', () => {
  const list = [puzzle({ id: 1 }), puzzle({ id: 2 })];

  it('serves the nth Puzzle on the nth day', () => {
    expect(puzzleForDate(list, '2026-10-28')).toEqual({ number: 2, puzzle: list[1] });
  });

  it('has nothing before launch or after the list runs out', () => {
    expect(puzzleForDate(list, '2026-10-26')).toBeNull();
    expect(puzzleForDate(list, '2026-10-29')).toBeNull();
  });
});

describe('the shipped puzzles', () => {
  it('number their ids in order from 1', () => {
    expect(PUZZLES.map((p) => p.id)).toEqual(PUZZLES.map((_, i) => i + 1));
  });

  it('run their route from start to target, one real word and one letter at a time', () => {
    for (const p of PUZZLES) {
      expect(p.start.length).toBe(p.target.length);
      expect(p.route[0]).toBe(p.start);
      expect(p.route.at(-1)).toBe(p.target);
      for (const [i, word] of p.route.entries()) {
        expect(VALID.has(word), `${word} in ${p.start}→${p.target}`).toBe(true);
        if (i) expect(lettersChanged(word, p.route[i - 1])).toBe(1);
      }
    }
  });

  it('set Par to the true shortest route', () => {
    for (const p of PUZZLES) expect(distancesTo(p.target).get(p.start), `${p.start}→${p.target}`).toBe(parOf(p));
  });

  it('never repeat a ladder', () => {
    const keys = PUZZLES.map((p) => `${p.start}>${p.target}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
