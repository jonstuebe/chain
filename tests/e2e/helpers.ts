import type { Page } from '@playwright/test';

/** A Puzzle the tests control, so the suite doesn't depend on today's date. Par 4. */
export const TEST_PUZZLE = {
  id: 1,
  start: 'cold',
  target: 'warm',
  route: ['cold', 'cord', 'word', 'ward', 'warm'],
};

/** Serves the test Puzzle for any date, so the game is the same every run. */
export async function stubPuzzle(page: Page, number = 1, puzzle = TEST_PUZZLE): Promise<void> {
  await page.route('**/api/puzzle/*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ number, puzzle }) }),
  );
}

/** Opens the game past the first-run help dialog. */
export async function openGame(page: Page): Promise<void> {
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Start playing' });
  if (await start.isVisible()) await start.click();
  await page.getByRole('list', { name: 'Your chain' }).waitFor();
}

/** Types a word on a physical keyboard and submits it. */
export async function step(page: Page, word: string): Promise<void> {
  await page.keyboard.type(word);
  await page.keyboard.press('Enter');
}

/** Taps a word out on the on-screen keyboard. */
export async function tap(page: Page, word: string): Promise<void> {
  const keyboard = page.getByRole('group', { name: 'Keyboard' });
  for (const letter of word) await keyboard.getByRole('button', { name: letter, exact: true }).click();
  await keyboard.getByRole('button', { name: 'Enter' }).click();
}

/** Dismisses the stats dialog that slides in after the finish. */
export async function closeStats(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Statistics' });
  await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await dialog.waitFor({ state: 'hidden' });
}
