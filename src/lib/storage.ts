import type { Hint } from './ladder';
import { overPar } from './ladder';

export const STORAGE_KEY = 'chain:v1';

export type ThemeSetting = 'system' | 'light' | 'dark';
export type GameStatus = 'playing' | 'won' | 'gave-up';

/** One Puzzle as played. `steps` is the Chain after the start word. */
export interface PuzzleRecord {
  steps: string[];
  hints: number;
  /** The Hint showing right now, if any. */
  hint: Hint | null;
  status: GameStatus;
}

export interface Stats {
  played: number;
  solved: number;
  currentStreak: number;
  maxStreak: number;
  /** Solves at Par, +1, +2, +3, +4 or more at indexes 0..4; give-ups at 5. */
  distribution: number[];
  /** The last Puzzle number played to a finish, for streak continuity. */
  lastPuzzle: number | null;
  lastSolved: boolean;
}

export interface Settings {
  theme: ThemeSetting;
}

export interface GameState {
  results: Record<number, PuzzleRecord>;
  stats: Stats;
  settings: Settings;
  seenHelp: boolean;
}

export const DISTRIBUTION_LABELS = ['Par', '+1', '+2', '+3', '+4 or more', 'Gave up'];
const GAVE_UP_SLOT = DISTRIBUTION_LABELS.length - 1;

export function defaultState(): GameState {
  return {
    results: {},
    stats: { played: 0, solved: 0, currentStreak: 0, maxStreak: 0, distribution: Array(DISTRIBUTION_LABELS.length).fill(0), lastPuzzle: null, lastSolved: false },
    settings: { theme: 'system' },
    seenHelp: false,
  };
}

export function emptyRecord(): PuzzleRecord {
  return { steps: [], hints: 0, hint: null, status: 'playing' };
}

/** Reads state, tolerating missing, corrupt, or partial data and blocked storage. */
export function loadState(storage: Storage | undefined = safeStorage()): GameState {
  const base = defaultState();
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed !== 'object') return base;
    const distribution = Array.isArray(parsed.stats?.distribution) && parsed.stats.distribution.length === DISTRIBUTION_LABELS.length
      ? parsed.stats.distribution.map((n) => Number(n) || 0)
      : base.stats.distribution;
    return {
      results: sanitizeResults(parsed.results),
      stats: { ...base.stats, ...parsed.stats, distribution },
      settings: { ...base.settings, ...parsed.settings },
      seenHelp: parsed.seenHelp === true,
    };
  } catch {
    return base;
  }
}

function sanitizeResults(results: unknown): Record<number, PuzzleRecord> {
  if (!results || typeof results !== 'object') return {};
  const out: Record<number, PuzzleRecord> = {};
  for (const [key, value] of Object.entries(results as Record<string, unknown>)) {
    const number = Number(key);
    const record = value as Partial<PuzzleRecord> | null;
    if (!Number.isInteger(number) || !record || !Array.isArray(record.steps)) continue;
    const status = record.status === 'won' || record.status === 'gave-up' ? record.status : 'playing';
    const hint = record.hint && typeof record.hint.word === 'string' && Number.isInteger(record.hint.position) ? record.hint : null;
    out[number] = { steps: record.steps.filter((s) => typeof s === 'string'), hints: Number(record.hints) || 0, hint, status };
  }
  return out;
}

export function saveState(state: GameState, storage: Storage | undefined = safeStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or quota exceeded: the game still works for this session.
  }
}

/** The Puzzle as the player left it, or a fresh one. */
export function recordFor(state: GameState, puzzle: number): PuzzleRecord {
  return state.results[puzzle] ?? emptyRecord();
}

/** Saves a step mid-game. Stats stay untouched until the Puzzle finishes. */
export function recordProgress(state: GameState, puzzle: number, record: PuzzleRecord): GameState {
  return { ...state, results: { ...state.results, [puzzle]: record } };
}

/** The distribution row a finished Puzzle lands in. */
export function distributionSlot(record: PuzzleRecord, par: number): number {
  if (record.status !== 'won') return GAVE_UP_SLOT;
  return Math.min(GAVE_UP_SLOT - 1, overPar(record.steps.length, record.hints, par));
}

/**
 * Records a finished Puzzle, stats included. A no-op once that Puzzle has a
 * finished record, so a Puzzle can never be counted twice.
 */
export function recordResult(state: GameState, puzzle: number, par: number, record: PuzzleRecord): GameState {
  const existing = state.results[puzzle];
  if (existing && existing.status !== 'playing') return state;
  if (record.status === 'playing') return recordProgress(state, puzzle, record);

  const solved = record.status === 'won';
  const distribution = state.stats.distribution.slice();
  const slot = distributionSlot(record, par);
  distribution[slot] = (distribution[slot] ?? 0) + 1;
  const continues = state.stats.lastPuzzle === puzzle - 1 && state.stats.lastSolved;
  const currentStreak = solved ? (continues ? state.stats.currentStreak + 1 : 1) : 0;

  return {
    ...state,
    results: { ...state.results, [puzzle]: record },
    stats: {
      played: state.stats.played + 1,
      solved: state.stats.solved + (solved ? 1 : 0),
      currentStreak,
      maxStreak: Math.max(state.stats.maxStreak, currentStreak),
      distribution,
      lastPuzzle: puzzle,
      lastSolved: solved,
    },
  };
}

/** The streak as of today: a missed day shows as 0 even before the next game. */
export function effectiveStreak(stats: Stats, today: number): number {
  if (stats.lastPuzzle === null) return 0;
  return today - stats.lastPuzzle <= 1 ? stats.currentStreak : 0;
}

export function solvedPercent(stats: Stats): number {
  return stats.played ? Math.round((stats.solved / stats.played) * 100) : 0;
}

function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
