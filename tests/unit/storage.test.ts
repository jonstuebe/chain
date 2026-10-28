import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  defaultState,
  distributionSlot,
  effectiveStreak,
  emptyRecord,
  loadState,
  recordFor,
  recordProgress,
  recordResult,
  saveState,
  solvedPercent,
  type GameState,
  type PuzzleRecord,
} from '../../src/lib/storage';
import { blockedStorage, memoryStorage } from './fixtures';

const PAR = 4;
const PAR_STEPS = ['cord', 'word', 'ward', 'warm'];
const won = (steps: string[], hints = 0): PuzzleRecord => ({ steps, hints, hint: null, status: 'won' });
const gaveUp = (steps: string[] = []): PuzzleRecord => ({ steps, hints: 0, hint: null, status: 'gave-up' });
const stored = (state: unknown) => memoryStorage({ [STORAGE_KEY]: JSON.stringify(state) });

/** Plays `numbers` in order, each solved at Par. */
function solveStreak(numbers: number[]): GameState {
  return numbers.reduce((state, n) => recordResult(state, n, PAR, won(PAR_STEPS)), defaultState());
}

describe('loadState', () => {
  it('starts fresh with nothing stored', () => {
    expect(loadState(memoryStorage())).toEqual(defaultState());
  });

  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const state = recordResult(defaultState(), 1, PAR, won(PAR_STEPS, 1));
    saveState(state, storage);
    expect(loadState(storage)).toEqual(state);
  });

  it.each(['{', 'null', '[]', '"nope"'])('falls back to a fresh state on junk: %s', (raw) => {
    expect(loadState(memoryStorage({ [STORAGE_KEY]: raw }))).toEqual(defaultState());
  });

  it('fills in fields a previous version never wrote', () => {
    const state = loadState(stored({ stats: { played: 3 } }));
    expect(state.stats.played).toBe(3);
    expect(state.stats.distribution).toEqual(defaultState().stats.distribution);
    expect(state.settings).toEqual(defaultState().settings);
  });

  it('drops a result that is not a list of steps, and repairs a partial one', () => {
    expect(loadState(stored({ results: { 1: { steps: 'cord' }, 2: { steps: ['cord'], hint: { word: 1 } } } })).results).toEqual({
      2: { steps: ['cord'], hints: 0, hint: null, status: 'playing' },
    });
  });

  it('survives blocked storage, reading and writing', () => {
    expect(loadState(blockedStorage())).toEqual(defaultState());
    expect(() => saveState(defaultState(), blockedStorage())).not.toThrow();
  });
});

describe('recordFor', () => {
  it('is empty for a Puzzle never opened', () => {
    expect(recordFor(defaultState(), 7)).toEqual(emptyRecord());
  });
});

describe('recordProgress', () => {
  it('saves a step without touching stats', () => {
    const state = recordProgress(defaultState(), 1, { ...emptyRecord(), steps: ['cord'] });
    expect(state.results[1].steps).toEqual(['cord']);
    expect(state.stats.played).toBe(0);
  });
});

describe('distributionSlot', () => {
  it('puts a solve in the row for its strokes over Par, hints included', () => {
    expect(distributionSlot(won(PAR_STEPS), PAR)).toBe(0);
    expect(distributionSlot(won(PAR_STEPS, 2), PAR)).toBe(2);
    expect(distributionSlot(won([...PAR_STEPS, 'a', 'b'], 1), PAR)).toBe(3);
  });

  it('lumps +4 and beyond together, and give-ups last', () => {
    expect(distributionSlot(won(PAR_STEPS, 9), PAR)).toBe(4);
    expect(distributionSlot(gaveUp(), PAR)).toBe(5);
  });
});

describe('recordResult', () => {
  it('counts a solve in its distribution row', () => {
    const state = recordResult(defaultState(), 1, PAR, won(PAR_STEPS, 1));
    expect(state.stats).toMatchObject({ played: 1, solved: 1, currentStreak: 1, maxStreak: 1 });
    expect(state.stats.distribution).toEqual([0, 1, 0, 0, 0, 0]);
  });

  it('counts a give-up in the last row and breaks the streak', () => {
    const state = recordResult(solveStreak([1, 2]), 3, PAR, gaveUp(['cord']));
    expect(state.stats).toMatchObject({ played: 3, solved: 2, currentStreak: 0, maxStreak: 2 });
    expect(state.stats.distribution[5]).toBe(1);
  });

  it('extends a streak over consecutive days', () => {
    expect(solveStreak([1, 2, 3]).stats).toMatchObject({ currentStreak: 3, maxStreak: 3 });
  });

  it('restarts the streak after a skipped day, keeping the best', () => {
    const state = recordResult(solveStreak([1, 2, 3]), 9, PAR, won(PAR_STEPS));
    expect(state.stats).toMatchObject({ currentStreak: 1, maxStreak: 3 });
  });

  it('refuses to count a finished Puzzle twice', () => {
    const once = recordResult(defaultState(), 1, PAR, won(PAR_STEPS));
    expect(recordResult(once, 1, PAR, gaveUp())).toBe(once);
  });

  it('saves a mid-game record without counting it', () => {
    const state = recordResult(defaultState(), 1, PAR, { ...emptyRecord(), steps: ['cord'] });
    expect(state.stats.played).toBe(0);
    expect(state.results[1].status).toBe('playing');
  });
});

describe('effectiveStreak', () => {
  const stats = solveStreak([1, 2, 3]).stats;

  it('counts today and yesterday as unbroken', () => {
    expect(effectiveStreak(stats, 3)).toBe(3);
    expect(effectiveStreak(stats, 4)).toBe(3);
  });

  it('shows a missed day as 0 before the next game is played', () => {
    expect(effectiveStreak(stats, 5)).toBe(0);
  });
});

describe('solvedPercent', () => {
  it('rounds, and is 0 with nothing played', () => {
    expect(solvedPercent(defaultState().stats)).toBe(0);
    expect(solvedPercent({ ...defaultState().stats, played: 3, solved: 2 })).toBe(67);
  });
});
