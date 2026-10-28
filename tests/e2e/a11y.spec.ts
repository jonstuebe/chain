import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { closeStats, openGame, step, stubPuzzle } from './helpers';

const scan = (page: Page) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

test.beforeEach(async ({ page }) => stubPuzzle(page));

for (const theme of ['light', 'dark'] as const) {
  test(`the help dialog, the ladder and the finish are accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    expect((await scan(page)).violations).toEqual([]);

    await page.getByRole('button', { name: 'Start playing' }).click();
    await step(page, 'cord');
    await page.getByRole('button', { name: 'Hint (+1)' }).click();
    expect((await scan(page)).violations).toEqual([]);

    for (const word of ['word', 'ward', 'warm']) await step(page, word);
    await closeStats(page);
    expect((await scan(page)).violations).toEqual([]);
  });
}

test('statistics and settings are accessible', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Statistics' }).click();
  expect((await scan(page)).violations).toEqual([]);

  await page.getByRole('dialog', { name: 'Statistics' }).getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  expect((await scan(page)).violations).toEqual([]);
});

test('Enter on a focused control does that control, not a submit', async ({ page }) => {
  await openGame(page);
  await step(page, 'cord');
  await page.getByRole('button', { name: 'Undo' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Steps 0')).toBeVisible();
});
