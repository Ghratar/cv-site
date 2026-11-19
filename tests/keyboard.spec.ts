import { test, expect } from '@playwright/test';
import { CvPage } from './pages/cv-page';

test.describe('keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'Shortcuts are for physical keyboards');

  test('B breaks something and F fixes it', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await page.keyboard.press('b');
    await cv.expectStatus('failed');
    await expect(cv.failedRows).toHaveCount(1);

    await page.keyboard.press('f');
    await cv.expectStatus('passed');
    await expect(cv.failedRows).toHaveCount(0);
  });

  test('R reruns the suite and L switches language', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await page.keyboard.press('r');
    await expect(page.locator('body')).toHaveAttribute('data-status', 'running');
    await cv.expectStatus('passed');

    await page.keyboard.press('l');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });

  test('shortcuts leave browser shortcuts alone', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await page.keyboard.press('Control+b');
    await expect(page.locator('body')).toHaveAttribute('data-status', 'passed');
    await expect(cv.failedRows).toHaveCount(0);
  });

  test('a bug can be injected and fixed without a mouse', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.bug('typo').focus();
    await page.keyboard.press('Enter');
    await cv.expectStatus('failed');

    await cv.fixButton.focus();
    await page.keyboard.press('Enter');
    await cv.expectStatus('passed');
  });
});
