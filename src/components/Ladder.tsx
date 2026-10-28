import { useEffect, useRef, type CSSProperties } from 'react';
import type { Hint } from '../lib/ladder';

interface LadderProps {
  start: string;
  target: string;
  /** The Chain after the start word. When solved, the last step is the target itself. */
  steps: string[];
  /** Letters typed for the next step; null once the Puzzle is over. */
  typed: string | null;
  hint: Hint | null;
  solved: boolean;
  /** Bumped on a rejected step, to shake the input rung. */
  shake: number;
  /** Climb back to the word after `count` steps. Absent once the Puzzle is over. */
  onClimbBack?: (count: number) => void;
}

const TILE_SIZE: Record<number, number> = { 3: 60, 4: 56, 5: 52 };

/** The ladder: the start word, each step taken, the word being typed, and the target. */
export function Ladder({ start, target, steps, typed, hint, solved, shake, onClimbBack }: LadderProps) {
  // The input rung while playing, the target once over: whichever the player should be looking at.
  const endRef = useRef<HTMLLIElement>(null);
  const shown = solved ? steps.slice(0, -1) : steps;
  const current = steps.at(-1) ?? start;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [steps.length, typed === null]);

  return (
    <ol className={solved ? 'ladder is-solved' : 'ladder'} aria-label="Your chain" style={{ '--ts': `${TILE_SIZE[start.length] ?? 52}px` } as CSSProperties}>
      <li className="rung rung-start">
        <Tiles word={start} target={target} />
        <span className="sr-only">Start: {start}</span>
      </li>
      {shown.map((word, i) => {
        const tiles = <Tiles word={word} previous={i === 0 ? start : shown[i - 1]} target={target} />;
        const label = <span className="rung-label" aria-hidden="true">{i + 1}</span>;
        return (
          <li key={i} className="rung rung-step">
            {onClimbBack ? (
              <button
                type="button"
                className="rung-button"
                // Keep focus where it was, so Enter still submits the next word.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => onClimbBack(i + 1)}
              >
                {tiles}
                {label}
                <span className="sr-only">Step {i + 1}: {word}. Climb back to here</span>
              </button>
            ) : (
              <>
                {tiles}
                {label}
                <span className="sr-only">Step {i + 1}: {word}</span>
              </>
            )}
          </li>
        );
      })}
      {typed === null ? null : (
        <li ref={endRef} key={`input-${shake}`} className={shake ? 'rung rung-input shake' : 'rung rung-input'}>
          <Tiles word={typed} length={start.length} input hinted={hint?.word === current ? hint.position : null} />
          <span className="rung-label" aria-hidden="true">{steps.length + 1}</span>
          <span className="sr-only">Next word: {typed ? typed.split('').join(' ') : 'empty'}</span>
        </li>
      )}
      <li ref={typed === null ? endRef : undefined} className="rung rung-target">
        <Tiles word={target} previous={solved ? (shown.at(-1) ?? start) : undefined} />
        {solved ? <span className="rung-label" aria-hidden="true">{steps.length}</span> : null}
        <span className="sr-only">{solved ? `Reached the target: ${target}` : `Target: ${target}`}</span>
      </li>
    </ol>
  );
}

interface TilesProps {
  word: string;
  /** Fixed width for a word still being typed. */
  length?: number;
  /** Marks the letter that changed from this word. */
  previous?: string;
  /** Underlines letters already in place. */
  target?: string;
  /** The rung being typed into. */
  input?: boolean;
  /** On the input rung, the position a Hint says to change. */
  hinted?: number | null;
}

function Tiles({ word, length = word.length, previous, target, input, hinted }: TilesProps) {
  return (
    <span className="tiles" aria-hidden="true">
      {Array.from({ length }, (_, i) => {
        const letter = word[i] ?? '';
        const classes = ['tile'];
        if (previous && letter && letter !== previous[i]) classes.push('is-changed');
        if (target && letter && letter === target[i]) classes.push('is-match');
        if (input) {
          if (letter) classes.push('is-filled');
          if (hinted === i) classes.push('is-hinted');
        }
        return (
          <span key={i} className={classes.join(' ')}>
            {letter}
          </span>
        );
      })}
    </span>
  );
}
