import { expect, type Locator, type Page } from '@playwright/test';

/** The six bugs a visitor can inject, and the check that is supposed to catch each one. */
export const BUGS = {
  typo: 'name',
  runaway: 'contact',
  cookie: 'cover',
  layout: 'layout',
  contrast: 'contrast',
  flip: 'upright',
} as const;

export type Bug = keyof typeof BUGS;
export type Status = 'passed' | 'failed' | 'running';

/** Page object for the CV site: one place that knows the selectors. */
export class CvPage {
  readonly summary: Locator;
  readonly verdict: Locator;
  readonly heading: Locator;
  readonly rows: Locator;
  readonly failedRows: Locator;
  readonly fixButton: Locator;
  readonly rerunButton: Locator;
  readonly langButton: Locator;
  readonly chaosButton: Locator;
  readonly motionToggle: Locator;
  readonly contactButton: Locator;
  readonly cookieBanner: Locator;
  readonly ticker: Locator;

  constructor(readonly page: Page) {
    this.summary = page.locator('#summary');
    this.verdict = page.locator('#verdict');
    this.heading = page.getByRole('heading', { level: 1 });
    this.rows = page.locator('.row');
    this.failedRows = page.locator('.row[data-state="fail"]');
    this.fixButton = page.locator('#fix');
    this.rerunButton = page.locator('#rerun');
    this.langButton = page.locator('#lang');
    this.chaosButton = page.locator('#chaos');
    this.motionToggle = page.locator('#motion');
    this.contactButton = page.locator('#contact');
    this.cookieBanner = page.locator('#cookie');
    this.ticker = page.locator('#track');
  }

  async goto() {
    // Keep the tests hermetic: the page must work without its web fonts.
    await this.page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
    await this.page.goto('/');
    await this.expectStatus('passed');
  }

  bug(name: Bug): Locator {
    return this.page.locator(`.bug[data-bug="${name}"]`);
  }

  check(name: string): Locator {
    return this.page.locator(`.row[data-check="${name}"]`);
  }

  /** Waits until the suite on the page has finished running and landed on the given status. */
  async expectStatus(status: Status) {
    await expect(this.page.locator('.row:not([data-state]), .row[data-state="pending"]')).toHaveCount(0);
    await expect(this.page.locator('body')).toHaveAttribute('data-status', status);
  }

  async inject(name: Bug) {
    await this.bug(name).click();
    await expect(this.bug(name)).toHaveAttribute('aria-pressed', 'true');
    await this.expectStatus('failed');
  }

  async fix() {
    await this.fixButton.click();
    await this.expectStatus('passed');
  }

  async failedChecks(): Promise<string[]> {
    return this.failedRows.evaluateAll(rows => rows.map(r => (r as HTMLElement).dataset.check ?? ''));
  }
}
