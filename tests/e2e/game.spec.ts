import { expect, test } from '@playwright/test';
import { closeStats, openGame, step, stubPuzzle, tap } from './helpers';

test.beforeEach(async ({ page }) => stubPuzzle(page));

const ladder = (page: import('@playwright/test').Page) => page.getByRole('list', { name: 'Your chain' });

test('shows the help dialog on a first visit, once', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible();
  await page.getByRole('button', { name: 'Start playing' }).click();

  await page.reload();
  await expect(page.getByRole('dialog', { name: 'How to play' })).toBeHidden();
});

test('a valid step climbs a rung @mobile', async ({ page }) => {
  await openGame(page);
  await expect(page.getByText('Steps 0')).toBeVisible();
  await tap(page, 'cord');
  await expect(page.getByText('Steps 1')).toBeVisible();
  await expect(ladder(page).getByRole('button', { name: /Step 1: cord/ })).toBeVisible();
});

test('refuses a bad step without spending one', async ({ page }) => {
  await openGame(page);
  await step(page, 'ward');
  await expect(page.getByText('Change exactly one letter')).toBeVisible();
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await step(page, 'cokd');
  await expect(page.getByText('Not in the word list')).toBeVisible();
  await expect(page.getByText('Steps 0')).toBeVisible();
});

test('undo and climbing back are free', async ({ page }) => {
  await openGame(page);
  await step(page, 'cord');
  await step(page, 'card');
  await step(page, 'ward');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Steps 2')).toBeVisible();
  await ladder(page).getByRole('button', { name: /Step 1: cord/ }).click();
  await expect(page.getByText('Steps 1')).toBeVisible();
  await expect(ladder(page).getByRole('button', { name: /card/ })).toHaveCount(0);
});

test('a hint highlights a letter and costs a stroke', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Hint (+1)' }).click();
  await expect(page.getByText(/Change letter \d/)).toBeVisible();
  await expect(page.locator('.tile.is-hinted')).toHaveCount(1);
  await expect(page.getByText('+ 1 hint')).toBeVisible();
});

test('reaching the target at par shares a perfect score', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openGame(page);
  for (const word of ['cord', 'word', 'ward', 'warm']) await step(page, word);

  await expect(page.getByRole('heading', { name: 'Par!' })).toBeVisible();
  await expect(page.getByText('A perfect 4-step chain.')).toBeVisible();
  await closeStats(page);

  await page.getByRole('button', { name: 'Share' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Chain #1 COLD → WARM');
  expect(copied).toContain('🟩🟩🟩🟩 Par');
  expect(copied).not.toMatch(/cord|ward/i);
});

test('a longer chain is scored over par', async ({ page }) => {
  await openGame(page);
  for (const word of ['cord', 'card', 'ward', 'warm']) await step(page, word);
  await expect(page.getByRole('heading', { name: 'Par!' })).toBeVisible();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start playing' }).click();
  for (const word of ['cord', 'card', 'cart', 'wart', 'warm']) await step(page, word);
  await expect(page.getByRole('heading', { name: 'Bogey' })).toBeVisible();
  await expect(page.getByText('5 steps, 1 over par.')).toBeVisible();
});

test('giving up shows the par route', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Give up' }).click();
  await page.getByRole('dialog', { name: 'Give up?' }).getByRole('button', { name: 'Give up' }).click();
  await expect(page.getByRole('heading', { name: 'Chain broken' })).toBeVisible();
  await expect(page.getByText(/Par route/)).toContainText('cord');
});

test('keeps the game where you left it across a reload', async ({ page }) => {
  await openGame(page);
  await step(page, 'cord');
  await page.reload();
  await expect(page.getByText('Steps 1')).toBeVisible();
  await expect(ladder(page).getByRole('button', { name: /Step 1: cord/ })).toBeVisible();
});

test('records the result in statistics', async ({ page }) => {
  await openGame(page);
  for (const word of ['cord', 'word', 'ward', 'warm']) await step(page, word);
  const stats = page.getByRole('dialog', { name: 'Statistics' });
  await expect(stats).toBeVisible();
  await expect(stats.getByText('Played').locator('..')).toContainText('1');
  await expect(stats.getByText('Solved %').locator('..')).toContainText('100');
});

test('switches theme from settings', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByText('Dark', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
