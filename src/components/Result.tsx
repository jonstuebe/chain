import { useState } from 'react';
import { parOf, type Puzzle } from '../lib/types';
import { overPar, scoreName } from '../lib/ladder';
import type { PuzzleRecord } from '../lib/storage';
import { buildShareText, shareResults } from '../lib/share';
import { Countdown } from './Countdown';
import { ShareIcon } from './Icons';

interface ResultProps {
  puzzle: Puzzle;
  puzzleNumber: number;
  record: PuzzleRecord;
  onExpire: () => void;
  onToast: (message: string) => void;
}

function subtitle(record: PuzzleRecord, par: number): string {
  if (record.status !== 'won') return 'Here’s the shortest route. Tomorrow’s a fresh climb.';
  const steps = record.steps.length;
  const over = overPar(steps, record.hints, par);
  if (over === 0) return `A perfect ${par}-step chain.`;
  const hints = record.hints ? ` and ${record.hints} hint${record.hints > 1 ? 's' : ''}` : '';
  return `${steps} steps${hints}, ${over} over par.`;
}

export function Result({ puzzle, puzzleNumber, record, onExpire, onToast }: ResultProps) {
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
      <h2 className="result-title">{won ? scoreName(overPar(record.steps.length, record.hints, par)) : 'Chain broken'}</h2>
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
