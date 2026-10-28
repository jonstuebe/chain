import { Modal } from './Modal';

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal title="How to play" open={open} onClose={onClose}>
      <p>Climb from the top word to the bottom word, one letter at a time.</p>
      <ul className="rules">
        <li>Each step changes exactly one letter and must be a real word.</li>
        <li>Par is the shortest possible chain. Match it for a perfect score.</li>
        <li>A green underline means that letter already matches the target.</li>
        <li>Tap any earlier word to climb back down to it. Undoing is free; hints add a step.</li>
      </ul>
      <p className="example" aria-label="Example: cold, cord, word, ward, warm">
        COLD → CO<i>R</i>D → <i>W</i>ORD → W<i>A</i>RD → WAR<i>M</i>
      </p>
      <p className="modal-footnote">
        Everyone gets the same ladder each day. Word ladders were invented by Lewis Carroll, who called them Doublets. Word list based on SCOWL by
        Kevin Atkinson.
      </p>
      <button className="button button-primary" type="button" onClick={onClose} data-autofocus>
        Start playing
      </button>
    </Modal>
  );
}
