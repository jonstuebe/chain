import { COMMON, VALID } from './words';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Every word one letter away from `word`. */
export function neighbours(word: string, valid: ReadonlySet<string> = VALID): string[] {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) {
    for (const c of ALPHABET) {
      if (c === word[i]) continue;
      const next = word.slice(0, i) + c + word.slice(i + 1);
      if (valid.has(next)) out.push(next);
    }
  }
  return out;
}

/** Fewest steps from each word that can reach `target` (breadth-first, outward from it). */
export function distancesTo(target: string, valid: ReadonlySet<string> = VALID): Map<string, number> {
  const distances = new Map([[target, 0]]);
  const queue = [target];
  for (let head = 0; head < queue.length; head++) {
    const word = queue[head];
    const next = distances.get(word)! + 1;
    for (const n of neighbours(word, valid)) {
      if (distances.has(n)) continue;
      distances.set(n, next);
      queue.push(n);
    }
  }
  return distances;
}

/** How many positions differ between two words of the same length. */
export function lettersChanged(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

export const NOT_A_WORD = 'Not in the word list';

/** Why `word` can't follow the end of `chain`, ignoring whether it's a real word. */
export function checkShape(chain: readonly string[], word: string): string | null {
  const current = chain[chain.length - 1];
  if (word.length !== current.length) return `Type a ${current.length}-letter word`;
  if (chain.includes(word)) return word === current ? 'That’s the same word' : 'You’ve already used that word';
  if (lettersChanged(word, current) !== 1) return 'Change exactly one letter';
  return null;
}

/** Why `word` can't be the next step after the end of `chain`, or null when it can. */
export function checkStep(chain: readonly string[], word: string, valid: ReadonlySet<string> = VALID): string | null {
  return checkShape(chain, word) ?? (valid.has(word) ? null : NOT_A_WORD);
}

/**
 * Steps from `word` to the target. Words outside VALID (accepted from the big
 * dictionary) aren't in `distances`, so they route through their VALID neighbours.
 */
export function distanceOf(word: string, distances: ReadonlyMap<string, number>, valid: ReadonlySet<string> = VALID): number | undefined {
  const known = distances.get(word);
  if (known !== undefined) return known;
  let best: number | undefined;
  for (const n of neighbours(word, valid)) {
    const d = distances.get(n);
    if (d !== undefined && (best === undefined || d + 1 < best)) best = d + 1;
  }
  return best;
}

export interface Hint {
  /** The word the Hint was given for; it lapses once the Chain moves on. */
  word: string;
  /** The position to change, 0-based. */
  position: number;
}

/**
 * Which letter of `word` to change to get one step closer to the target,
 * preferring a move onto an everyday word. Null when there's no route from here.
 */
export function findHint(word: string, distances: ReadonlyMap<string, number>, common: ReadonlySet<string> = COMMON, valid: ReadonlySet<string> = VALID): Hint | null {
  const here = distanceOf(word, distances, valid);
  if (here === undefined || here === 0) return null;
  const closer = neighbours(word, valid).filter((n) => distances.get(n) === here - 1);
  const best = closer.find((n) => common.has(n)) ?? closer[0];
  if (!best) return null;
  return { word, position: [...word].findIndex((c, i) => c !== best[i]) };
}

/**
 * Strokes against Par: each step counts one, and so does each Hint. Negative
 * when the player beats Par, which the Big dictionary makes possible.
 */
export function vsPar(steps: number, hints: number, par: number): number {
  return steps + hints - par;
}

/** Strokes over Par, never below zero. */
export function overPar(steps: number, hints: number, par: number): number {
  return Math.max(0, vsPar(steps, hints, par));
}

/** The golf name for a score against Par: -1 is a Birdie, +1 a Bogey. */
export function scoreName(over: number): string {
  if (over === -1) return 'Birdie!';
  if (over === -2) return 'Eagle!';
  if (over === -3) return 'Albatross!';
  if (over < 0) return `${-over} under par!`;
  if (over === 0) return 'Par!';
  if (over === 1) return 'Bogey';
  if (over === 2) return 'Double bogey';
  if (over === 3) return 'Triple bogey';
  return `+${over} over par`;
}
