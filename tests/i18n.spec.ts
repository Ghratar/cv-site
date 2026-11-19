import { test, expect } from '@playwright/test';
import { CvPage } from './pages/cv-page';

test.describe('language switch', () => {
  test('translates the page, the results and the tab title', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.langButton.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page).toHaveTitle('Alexandru Ilie · Testeur QA automatisation');
    await expect(cv.summary).toHaveText('20 réussis · 1 instable · 1 ignoré');
    await expect(page.getByRole('heading', { name: 'Allez-y, cassez quelque chose.' })).toBeVisible();
    await expect(cv.ticker).toContainText('RÉUSSI');
    await expect(cv.langButton).toHaveText('EN');
  });

  test('is remembered after a reload', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.langButton.click();
    await page.reload();
    await cv.expectStatus('passed');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(cv.summary).toHaveText('20 réussis · 1 instable · 1 ignoré');
  });

  test('reports failures in French too', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.langButton.click();
    await cv.inject('typo');

    await expect(cv.summary).toHaveText('1 échoué · 19 réussis · 1 instable · 1 ignoré');
    await expect(cv.check('name').locator('.diff')).toHaveText(/Attendu: "Alexandru Ilie"\s+Reçu: "Alexandru Ille"/);
    await expect(cv.ticker).toContainText('ÉCHEC');
  });

  test('switching language keeps an injected bug failing', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await cv.inject('flip');
    await cv.langButton.click();

    await expect(page.locator('body')).toHaveAttribute('data-status', 'failed');
    await expect(cv.check('upright').locator('.diff')).toHaveText(/Reçu: rotation de 180°/);
  });
});

test.describe('a visitor whose browser is set to French', () => {
  test.use({ locale: 'fr-FR' });

  test('gets the French version without asking', async ({ page }) => {
    const cv = new CvPage(page);
    await cv.goto();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(cv.summary).toHaveText('20 réussis · 1 instable · 1 ignoré');
  });
});
