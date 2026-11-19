import { test, expect } from '@playwright/test';
import { CvPage } from './pages/cv-page';

test.describe('the report', () => {
  test('loads green with every CV claim accounted for', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    const cv = new CvPage(page);
    await cv.goto();

    await expect(page).toHaveTitle('Alexandru Ilie · QA automation tester');
    await expect(cv.heading).toHaveText('Alexandru Ilie');
    await expect(cv.summary).toHaveText('20 passed · 1 flaky · 1 skipped');
    await expect(cv.rows).toHaveCount(22);
    await expect(cv.failedRows).toHaveCount(0);
    await expect(cv.fixButton).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('is honest about the weak spots', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await expect(cv.rows.filter({ hasText: 'holds a conversation in German' })).toHaveAttribute('data-state', 'flaky');
    await expect(cv.rows.filter({ hasText: 'holds a computer science degree' })).toHaveAttribute('data-state', 'skip');
  });

  test('opens a row to show the evidence behind it', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    const row = cv.rows.filter({ hasText: 'QA Specialist at International Online Solutions' });
    await expect(row.getByText('September 2023 to July 2025')).toBeHidden();
    await row.locator('summary').click();
    await expect(row.getByText('September 2023 to July 2025')).toBeVisible();
    await expect(row.getByRole('listitem')).toHaveCount(5);
  });

  test('"Run again" reruns the whole suite', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.rerunButton.click();
    await expect(page.locator('body')).toHaveAttribute('data-status', 'running');
    await cv.expectStatus('passed');
    await expect(cv.summary).toHaveText('20 passed · 1 flaky · 1 skipped');
  });

  test('fits the viewport without scrolling sideways', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('contact details', () => {
  test('point to the right places', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await expect(cv.contactButton).toHaveAttribute('href', 'mailto:alexandru.ilie.eu@gmail.com');
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/alexandru-ilie-921731164');
    await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Ghratar');
  });

  test('the CV download is a real PDF', async ({ page, request }) => {
    const cv = new CvPage(page);
    await cv.goto();

    const href = await page.getByRole('link', { name: /Download the CV/ }).getAttribute('href');
    const response = await request.get(`/${href}`);
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
