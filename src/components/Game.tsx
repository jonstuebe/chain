import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parOf, type Puzzle } from '../lib/types';
import { checkStep, distancesTo, findHint, overPar, scoreName } from '../lib/ladder';
import type { PuzzleRecord } from '../lib/storage';
import { Ladder } from './Ladder';
import { Keyboard, type Key } from './Keyboard';
import { Result } from './Result';
import { Modal } from './Modal';

interface GameProps {
  puzzle: Puzzle;
  puzzleNumber: number;
  /** Today's date as shown above the ladder. */
  date: string;
  record: PuzzleRecord;
  onRecord: (record: PuzzleRecord) => void;
  onAnnounce: (message: string) => void;
  onToast: (message: string) => void;
  onExpire: () => void;
}

export function Game({ puzzle, puzzleNumber, date, record, onRecord, onAnnounce, onToast, onExpire }: GameProps) {
  const [typed, setTyped] = useState('');
  const [shake, setShake] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const distances = useMemo(() => distancesTo(puzzle.target), [puzzle.target]);

  const par = parOf(puzzle);
  const playing = record.status === 'playing';
  const chain = [puzzle.start, ...record.steps];
  const current = chain[chain.length - 1];

  const reject = useCallback(
    (message: string) => {
      onToast(message);
      setShake((n) => n + 1);
    },
    [onToast],
  );

  const submit = () => {
    const problem = checkStep(chain, typed);
    if (problem) return reject(problem);
    const steps = [...record.steps, typed];
    setTyped('');
    if (typed === puzzle.target) {
      onAnnounce(`${scoreName(overPar(steps.length, record.hints, par))} You reached ${puzzle.target}.`);
      onRecord({ ...record, steps, hint: null, status: 'won' });
      return;
    }
    onRecord({ ...record, steps });
    if (!distances.has(typed)) onToast('Dead end: no route to the target from here');
    else onAnnounce(`Step ${steps.length}: ${typed}.`);
  };

  const press = (key: Key) => {
    if (!playing) return;
    if (key === 'enter') return submit();
    if (key === 'back') return setTyped((t) => t.slice(0, -1));
    if (/^[a-z]$/.test(key)) setTyped((t) => (t.length < puzzle.start.length ? t + key : t));
  };

  // Physical keyboards type straight onto the ladder.
  const pressRef = useRef(press);
  pressRef.current = press;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('textarea, input')) return;
      // Enter on a focused control (Undo, a rung) belongs to that control.
      if (e.key === 'Enter' && target?.closest('button, a')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        pressRef.current('enter');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        pressRef.current('back');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        pressRef.current(e.key.toLowerCase());
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const climbBack = (count: number) => {
    setTyped('');
    onRecord({ ...record, steps: record.steps.slice(0, count) });
    onAnnounce(`Back to step ${count}: ${count ? record.steps[count - 1] : puzzle.start}.`);
  };

  const hint = () => {
    if (record.hint?.word === current) return onToast('Change the highlighted letter');
    const next = findHint(current, distances);
    if (!next) return onToast('No route from here. Try undoing a step');
    onRecord({ ...record, hints: record.hints + 1, hint: next });
    onToast(`Change letter ${next.position + 1}`);
  };

  const giveUp = () => {
    setConfirming(false);
    onAnnounce('You gave up. The par route is shown.');
    onRecord({ ...record, hint: null, status: 'gave-up' });
  };

  const steps = record.steps.length;

  return (
    <>
      <div className="meta">
        <span>
          <strong>No. {puzzleNumber}</strong>, {date}
        </span>
        <span className="meta-score">
          Steps <strong>{steps}</strong>
          {record.hints ? ` + ${record.hints} hint${record.hints > 1 ? 's' : ''}` : ''} · Par <strong>{par}</strong>
        </span>
      </div>

      <div className="ladder-wrap">
        <Ladder
          start={puzzle.start}
          target={puzzle.target}
          steps={record.steps}
          typed={playing ? typed : null}
          hint={record.hint}
          solved={record.status === 'won'}
          shake={shake}
          onClimbBack={playing ? climbBack : undefined}
        />
      </div>

      {playing ? (
        <section className="play" aria-label="Controls">
          <div className="tools">
            <button type="button" className="tool" disabled={!steps} onPointerDown={(e) => e.preventDefault()} onClick={() => climbBack(steps - 1)}>
              Undo
            </button>
            <button type="button" className="tool" onPointerDown={(e) => e.preventDefault()} onClick={hint}>
              Hint (+1)
            </button>
            <button type="button" className="tool" onClick={() => setConfirming(true)}>
              Give up
            </button>
          </div>
          <Keyboard onKey={press} />
        </section>
      ) : (
        <Result puzzle={puzzle} puzzleNumber={puzzleNumber} record={record} onExpire={onExpire} onToast={onToast} />
      )}

      <Modal title="Give up?" open={confirming} onClose={() => setConfirming(false)}>
        <p>You’ll see the par route, and today won’t count as solved.</p>
        <div className="modal-actions">
          <button type="button" className="button button-ghost" onClick={() => setConfirming(false)} data-autofocus>
            Keep climbing
          </button>
          <button type="button" className="button button-primary" onClick={giveUp}>
            Give up
          </button>
        </div>
      </Modal>
    </>
  );
}
