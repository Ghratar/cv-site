import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CvPage } from './pages/cv-page';

const GREEN = 'rgb(13, 92, 58)';
const RED = 'rgb(154, 29, 24)';

/** The page colour fades between states; wait for the fade to finish before measuring contrast. */
async function colourSettled(page: Page, colour: string) {
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(colour);
}

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  test('the passing page has no violations', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();
    await colourSettled(page, GREEN);

    expect(await violations(page)).toEqual([]);
  });

  test('the French page has no violations', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();
    await cv.langButton.click();
    await colourSettled(page, GREEN);

    expect(await violations(page)).toEqual([]);
  });

  test('the failing page has no violations either', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();
    await cv.inject('typo');
    await colourSettled(page, RED);

    expect(await violations(page)).toEqual([]);
  });

  test('every row can be opened with the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is a desktop concern');
    const cv = new CvPage(page);
    await cv.goto();

    const row = cv.rows.filter({ hasText: 'works in French' });
    await row.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(row.getByText('Bilingual French section')).toBeVisible();
  });
});
