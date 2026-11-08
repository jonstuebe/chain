import { VALID } from './words';

/**
 * The big dictionary lives in D1 behind the Worker. The bundled VALID list
 * still decides Par and Hints and works offline; the big one only lets more
 * Steps through when the player is online. Words it accepted are remembered
 * here so they keep working offline afterwards.
 */
const EXTRA_KEY = 'chain:extra-words';

let extras: Set<string> | null = null;

function loadExtras(): Set<string> {
  if (extras) return extras;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(EXTRA_KEY) ?? '[]');
    extras = new Set(Array.isArray(parsed) ? parsed.filter((w): w is string => typeof w === 'string') : []);
  } catch {
    extras = new Set();
  }
  return extras;
}

function rememberExtra(word: string): void {
  const set = loadExtras();
  set.add(word);
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify([...set]));
  } catch {
    // Blocked storage: remembered for this session only.
  }
}

/** True when `word` is a known word without asking the server. */
export function isKnownWord(word: string): boolean {
  return VALID.has(word) || loadExtras().has(word);
}

export type Lookup = 'valid' | 'invalid' | 'offline';

/** Asks the big dictionary about a word the bundled list doesn't have. */
export async function lookupWord(word: string, fetchImpl: typeof fetch = fetch): Promise<Lookup> {
  if (isKnownWord(word)) return 'valid';
  try {
    const res = await fetchImpl(`/api/words/${encodeURIComponent(word)}`);
    if (!res.ok) return 'offline';
    const { valid } = (await res.json()) as { valid: boolean };
    if (valid) rememberExtra(word);
    return valid ? 'valid' : 'invalid';
  } catch {
    return 'offline';
  }
}
