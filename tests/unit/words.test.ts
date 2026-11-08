import { describe, expect, it } from 'vitest';
import { handleWords, type WordsDb } from '../../worker/words';
import { distanceOf, distancesTo, findHint } from '../../src/lib/ladder';

const DICTIONARY = ['cold', 'cord', 'core', 'cork', 'corn', 'card', 'axed', 'bing', 'zyme', 'cat', 'crane'];

/** Answers the one lookup worker/words.ts sends, from an in-memory list. */
function fakeDb(): WordsDb {
  return {
    prepare: () => ({
      bind: (...params) => ({
        first: async <T,>() => (DICTIONARY.includes(params[0] as string) ? ({ ok: 1 } as T) : null),
      }),
    }),
  };
}

const get = (path: string, method = 'GET') => handleWords(new Request(`https://chain.jonstuebe.com${path}`, { method }), fakeDb());

describe('GET /api/words/:word', () => {
  it('knows words beyond the bundled list', async () => {
    await expect((await get('/api/words/zyme')).json()).resolves.toEqual({ word: 'zyme', valid: true });
  });

  it('says no to a non-word without asking the database', async () => {
    await expect((await get('/api/words/qq1')).json()).resolves.toEqual({ word: 'qq1', valid: false });
    await expect((await get('/api/words/xqzt')).json()).resolves.toEqual({ word: 'xqzt', valid: false });
  });

  it('405s on a write', async () => {
    expect((await get('/api/words/zyme', 'POST')).status).toBe(405);
  });

  it('404s without a word', async () => {
    expect((await get('/api/words')).status).toBe(404);
  });
});

describe('words beyond the bundled list', () => {
  const valid = new Set(['cold', 'cord', 'word', 'ward', 'warm']);
  const distances = distancesTo('warm', valid);

  it('route through their bundled neighbours', () => {
    // "wold" isn't bundled, but "cold" and "word" are one letter away.
    expect(distanceOf('wold', distances, valid)).toBe(3);
  });

  it('still get Hints', () => {
    expect(findHint('wold', distances, valid, valid)).toEqual({ word: 'wold', position: 2 });
  });

  it('are a dead end when no bundled neighbour has a route', () => {
    expect(distanceOf('zzzz', distances, valid)).toBeUndefined();
  });
});
