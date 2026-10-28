import { parOf, type Puzzle } from './types';
import { overPar } from './ladder';
import type { PuzzleRecord } from './storage';

export const GAME_URL = 'chain.jonstuebe.com';

export const MARKS = {
  /** A step within Par. */
  par: '🟩',
  /** A step past Par. */
  over: '🟨',
  hint: '💡',
  gaveUp: '🏳️',
};

/** The spoiler-free result row, e.g. `🟩🟩🟩🟩🟨💡 +2`: no words from the Chain itself. */
export function resultLine(record: PuzzleRecord, par: number): string {
  if (record.status !== 'won') return `${MARKS.gaveUp} Gave up`;
  const steps = record.steps.length;
  const over = overPar(steps, record.hints, par);
  const marks = MARKS.par.repeat(Math.min(steps, par)) + MARKS.over.repeat(Math.max(0, steps - par)) + MARKS.hint.repeat(record.hints);
  return `${marks} ${over === 0 ? 'Par' : `+${over}`}`;
}

export function buildShareText(puzzleNumber: number, puzzle: Puzzle, record: PuzzleRecord): string {
  const head = `Chain #${puzzleNumber} ${puzzle.start.toUpperCase()} → ${puzzle.target.toUpperCase()}`;
  return `${head}\n${resultLine(record, parOf(puzzle))}\n\n${GAME_URL}`;
}

export type ShareOutcome = 'shared' | 'copied' | 'aborted' | 'failed';

/**
 * Native share sheet where available (phones), clipboard otherwise.
 * 'failed' means the caller should show the text for manual copying.
 */
export async function shareResults(text: string, nav: Navigator = navigator): Promise<ShareOutcome> {
  if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ text })) {
    try {
      await nav.share({ text });
      return 'shared';
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') return 'aborted';
      // Otherwise fall through to the clipboard.
    }
  }
  try {
    if (!nav.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await nav.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
