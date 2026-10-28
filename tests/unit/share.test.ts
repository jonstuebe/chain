import { describe, expect, it, vi } from 'vitest';
import { buildShareText, resultLine, shareResults } from '../../src/lib/share';
import type { PuzzleRecord } from '../../src/lib/storage';
import { puzzle } from './fixtures';

const record = (steps: string[], hints = 0, status: PuzzleRecord['status'] = 'won'): PuzzleRecord => ({ steps, hints, hint: null, status });

describe('resultLine', () => {
  it('is all green at Par', () => {
    expect(resultLine(record(['cord', 'word', 'ward', 'warm']), 4)).toBe('🟩🟩🟩🟩 Par');
  });

  it('marks steps past Par, then hints', () => {
    expect(resultLine(record(['a', 'b', 'c', 'd', 'e'], 1), 4)).toBe('🟩🟩🟩🟩🟨💡 +2');
  });

  it('says so on a give-up', () => {
    expect(resultLine(record(['cord'], 0, 'gave-up'), 4)).toBe('🏳️ Gave up');
  });
});

describe('buildShareText', () => {
  it('names the Puzzle and its ends, but no word from the Chain', () => {
    const text = buildShareText(3, puzzle(), record(['cord', 'word', 'ward', 'warm']));
    expect(text).toBe('Chain #3 COLD → WARM\n🟩🟩🟩🟩 Par\n\nchain.jonstuebe.com');
    expect(text).not.toMatch(/cord|word|ward/i);
  });
});

describe('shareResults', () => {
  const nav = (overrides: Partial<Navigator>) => overrides as Navigator;

  it('uses the share sheet when it can', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    await expect(shareResults('x', nav({ share, canShare: () => true }))).resolves.toBe('shared');
  });

  it('treats a dismissed share sheet as aborted, not a failure', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error(), { name: 'AbortError' }));
    await expect(shareResults('x', nav({ share, canShare: () => true }))).resolves.toBe('aborted');
  });

  it('falls back to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(shareResults('x', nav({ clipboard: { writeText } as unknown as Clipboard }))).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('x');
  });

  it('fails when neither is available, so the text can be shown', async () => {
    await expect(shareResults('x', nav({}))).resolves.toBe('failed');
  });
});
