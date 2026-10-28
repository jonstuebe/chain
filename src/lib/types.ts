/** One day's ladder, as the Worker hands it to the client. */
export interface Puzzle {
  id: number;
  /** The word the Chain starts from, lowercase. */
  start: string;
  /** The word the Chain must reach, the same length as `start`. */
  target: string;
  /** A shortest route, `start` to `target` inclusive. Its step count is Par. */
  route: string[];
}

/** Steps in the shortest possible Chain. */
export function parOf(puzzle: Puzzle): number {
  return puzzle.route.length - 1;
}
