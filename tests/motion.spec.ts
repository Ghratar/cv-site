import { test, expect } from '@playwright/test';
import { BUGS, CvPage, type Bug } from './pages/cv-page';

test.describe('with motion allowed', () => {
  test('the ticker scrolls and no opt-in is offered', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await expect(cv.motionToggle).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#track')!).animationName)).toBe('slide');
  });
});

test.describe('with reduced motion requested', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nothing animates until the visitor opts in', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await expect(cv.motionToggle).toBeVisible();
    await expect(cv.motionToggle).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#track')!).animationName)).toBe('none');

    await cv.motionToggle.click();
    await cv.expectStatus('passed');

    await expect(cv.motionToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/motion/);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#track')!).animationName)).toBe('slide');
  });

  // Regression: with reduced motion the checks once read stale values and reported a bug one run late.
  for (const bug of Object.keys(BUGS) as Bug[]) {
    test(`"${bug}" is still caught on the same run`, async ({ page }) => {
      const cv = new CvPage(page);
      await cv.goto();

      await cv.inject(bug);
      expect(await cv.failedChecks()).toEqual([BUGS[bug]]);

      await cv.fix();
      await expect(cv.failedRows).toHaveCount(0);
    });
  }
});
