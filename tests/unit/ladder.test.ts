import { describe, expect, it } from 'vitest';
import { checkStep, distancesTo, findHint, lettersChanged, neighbours, overPar, scoreName } from '../../src/lib/ladder';

/** A tiny dictionary, so routes are easy to reason about. */
const WORDS = new Set(['cold', 'cord', 'word', 'ward', 'warm', 'card', 'core', 'gold']);
const COMMON = new Set(['cord', 'word', 'ward', 'warm']);

describe('neighbours', () => {
  it('finds every word one letter away', () => {
    expect(neighbours('cord', WORDS).sort()).toEqual(['card', 'cold', 'core', 'word']);
  });
});

describe('distancesTo', () => {
  it('counts the fewest steps from each reachable word', () => {
    const d = distancesTo('warm', WORDS);
    expect(d.get('warm')).toBe(0);
    expect(d.get('cold')).toBe(4);
    expect(d.get('gold')).toBe(5);
  });

  it('leaves out words with no route', () => {
    expect(distancesTo('warm', new Set(['warm', 'zzzz'])).has('zzzz')).toBe(false);
  });
});

describe('lettersChanged', () => {
  it('counts differing positions', () => {
    expect(lettersChanged('cold', 'cord')).toBe(1);
    expect(lettersChanged('cold', 'warm')).toBe(4);
  });
});

describe('checkStep', () => {
  const chain = ['cold', 'cord'];

  it('accepts a real word one letter away', () => {
    expect(checkStep(chain, 'word', WORDS)).toBeNull();
  });

  it.each([
    ['wor', 'Type a 4-letter word'],
    ['cord', 'That’s the same word'],
    ['cold', 'You’ve already used that word'],
    ['ward', 'Change exactly one letter'],
    ['cork', 'Not in the word list'],
  ])('refuses %s: %s', (word, message) => {
    expect(checkStep(chain, word, WORDS)).toBe(message);
  });
});

describe('findHint', () => {
  const d = distancesTo('warm', WORDS);

  it('points at the letter that gets one step closer', () => {
    expect(findHint('cold', d, COMMON, WORDS)).toEqual({ word: 'cold', position: 2 });
  });

  it('prefers a move onto an everyday word', () => {
    // From cord, both word (common) and card reach ward in one; word wins.
    expect(findHint('cord', d, COMMON, WORDS)).toEqual({ word: 'cord', position: 0 });
  });

  it('has nothing to say from a dead end, or at the target', () => {
    expect(findHint('zzzz', d, COMMON, WORDS)).toBeNull();
    expect(findHint('warm', d, COMMON, WORDS)).toBeNull();
  });
});

describe('scoring', () => {
  it('counts each step and each hint as a stroke', () => {
    expect(overPar(4, 0, 4)).toBe(0);
    expect(overPar(5, 1, 4)).toBe(2);
  });

  it('names the score like golf', () => {
    expect([0, 1, 2, 3, 4, 7].map(scoreName)).toEqual(['Par!', 'Bogey', 'Double bogey', 'Triple bogey', '+4 over par', '+7 over par']);
  });
});
