import { test, expect } from '@playwright/test';
import { BUGS, CvPage, type Bug } from './pages/cv-page';

/** What the failing check should report for each bug. */
const RECEIVED: Record<Bug, RegExp> = {
  typo: /Received: "Alexandru Ille"/,
  runaway: /Received: button \d+px outside its container/,
  cookie: /Received: a cookie banner covering \d+% of the button/,
  layout: /Received: 22 rows transformed/,
  contrast: /Received: 1\.\d:1/,
  flip: /Received: rotated 180°/,
};

test.describe('injected bugs', () => {
  for (const bug of Object.keys(BUGS) as Bug[]) {
    test(`"${bug}" fails exactly one check and recovers after the fix`, async ({ page }) => {
      const cv = new CvPage(page);
      await cv.goto();

      await cv.inject(bug);

      expect(await cv.failedChecks()).toEqual([BUGS[bug]]);
      await expect(cv.summary).toHaveText('1 failed · 19 passed · 1 flaky · 1 skipped');
      await expect(page).toHaveTitle(/^\(1 failed\) /);
      await expect(cv.check(BUGS[bug]).locator('.diff')).toHaveText(RECEIVED[bug]);
      await expect(cv.fixButton).toBeVisible();

      await cv.fix();

      await expect(cv.failedRows).toHaveCount(0);
      await expect(cv.bug(bug)).toHaveAttribute('aria-pressed', 'false');
      await expect(cv.summary).toHaveText('20 passed · 1 flaky · 1 skipped');
      await expect(cv.fixButton).toBeHidden();
    });
  }

  test('the typo really changes the heading', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.inject('typo');
    await expect(cv.heading).toHaveText('Alexandru Ille');
    await cv.fix();
    await expect(cv.heading).toHaveText('Alexandru Ilie');
  });

  test('a bug can be switched off by clicking it again', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.inject('contrast');
    await cv.bug('contrast').click();
    await cv.expectStatus('passed');
    await expect(cv.failedRows).toHaveCount(0);
  });

  test('the cookie banner can be rejected, which fixes the bug', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.inject('cookie');
    await expect(cv.cookieBanner).toBeVisible();
    await cv.cookieBanner.getByRole('button', { name: 'Reject' }).click();
    await cv.expectStatus('passed');
    await expect(cv.cookieBanner).toBeHidden();
  });

  test('the chaos monkey breaks all six at once', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.chaosButton.click();
    await cv.expectStatus('failed');

    expect((await cv.failedChecks()).sort()).toEqual(Object.values(BUGS).sort());
    await expect(cv.summary).toHaveText('6 failed · 14 passed · 1 flaky · 1 skipped');
    await expect(cv.chaosButton).toHaveAttribute('aria-pressed', 'true');

    await cv.fix();
    await expect(cv.failedRows).toHaveCount(0);
    await expect(cv.chaosButton).toHaveAttribute('aria-pressed', 'false');
  });
});
