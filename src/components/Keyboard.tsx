import { BackspaceIcon } from './Icons';

export type Key = 'enter' | 'back' | string;

const ROWS = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'];

/** The on-screen keyboard. Keys never take focus, so a physical Enter still submits. */
export function Keyboard({ onKey }: { onKey: (key: Key) => void }) {
  return (
    <div className="keyboard" role="group" aria-label="Keyboard">
      {ROWS.map((row) => (
        <div key={row} className="keyboard-row">
          {[...row].map((k) => {
            const key = k === '+' ? 'enter' : k === '-' ? 'back' : k;
            return (
              <button
                key={key}
                type="button"
                className={key === 'enter' ? 'key key-wide key-enter' : key === 'back' ? 'key key-wide' : 'key'}
                aria-label={key === 'back' ? 'Backspace' : undefined}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => onKey(key)}
              >
                {key === 'enter' ? 'Enter' : key === 'back' ? <BackspaceIcon /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
