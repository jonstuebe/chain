import words from './words.json';

/**
 * Every word a step may land on: 3 to 5 letters, from SCOWL. It ships to the
 * client on purpose: it's the same every day, so it gives nothing away.
 */
export const VALID: ReadonlySet<string> = new Set(words.valid.split(' '));

/** The everyday subset of VALID, preferred when a Hint has to pick a word. */
export const COMMON: ReadonlySet<string> = new Set(words.common.split(' '));
