import { useState } from 'react';
import { parOf, type Puzzle } from '../lib/types';
import { scoreName, vsPar } from '../lib/ladder';
import type { PuzzleRecord } from '../lib/storage';
import { buildShareText, shareResults } from '../lib/share';
import { Confetti } from './Confetti';
import { Countdown } from './Countdown';
import { ShareIcon } from './Icons';

interface ResultProps {
  puzzle: Puzzle;
  puzzleNumber: number;
  record: PuzzleRecord;
  onExpire: () => void;
  onToast: (message: string) => void;
  /** Throw confetti: the player just finished under Par. */
  celebrate?: boolean;
}

function subtitle(record: PuzzleRecord, par: number): string {
  if (record.status !== 'won') return 'Here’s the shortest route. Tomorrow’s a fresh climb.';
  const steps = record.steps.length;
  const score = vsPar(steps, record.hints, par);
  const hints = record.hints ? ` and ${record.hints} hint${record.hints > 1 ? 's' : ''}` : '';
  if (score < 0) return `${steps} steps${hints}, ${-score} under par. You beat the par route!`;
  if (score === 0) return `A perfect ${par}-step chain.`;
  return `${steps} steps${hints}, ${score} over par.`;
}

export function Result({ puzzle, puzzleNumber, record, onExpire, onToast, celebrate }: ResultProps) {
  const [manual, setManual] = useState<string | null>(null);
  const par = parOf(puzzle);
  const won = record.status === 'won';

  const share = async () => {
    const text = buildShareText(puzzleNumber, puzzle, record);
    const outcome = await shareResults(text);
    if (outcome === 'copied') onToast('Copied results to clipboard');
    if (outcome === 'failed') {
      setManual(text);
      onToast('Copy your result below');
    }
  };

  return (
    <section className="result">
      {celebrate ? <Confetti /> : null}
      <h2 className="result-title">{won ? scoreName(vsPar(record.steps.length, record.hints, par)) : 'Chain broken'}</h2>
      <p className="result-sub">{subtitle(record, par)}</p>
      <p className="par-route">
        Par route:{' '}
        {puzzle.route.map((word, i) => (
          <span key={word}>
            {i ? ' → ' : null}
            <strong>{word}</strong>
          </span>
        ))}
      </p>
      <button className="button button-primary button-share" type="button" onClick={share}>
        Share
        <ShareIcon />
      </button>
      {manual ? (
        <textarea className="manual" readOnly aria-label="Your result to copy" value={manual} onFocus={(e) => e.target.select()} />
      ) : null}
      <Countdown onExpire={onExpire} />
    </section>
  );
}
