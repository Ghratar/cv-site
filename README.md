# CV as a test report

[![Playwright tests](https://github.com/Ghratar/cv-site/actions/workflows/playwright.yml/badge.svg)](https://github.com/Ghratar/cv-site/actions/workflows/playwright.yml)

My CV, built as a page that behaves like a test run. Every line of the CV is a test in a report, and the whole page takes the colour of the result: green when everything passes, red when something fails.

Visitors can inject six real bugs into the page (a typo in my name, a contact button that wanders off, a cookie banner covering it, a wrecked layout, unreadable contrast, an upside-down page). Assertions running in the page catch each one and show expected against received.

This repository also holds the Playwright suite that tests the page from the outside, and the GitHub Actions workflow that runs it on every push.

## What the suite covers

| File | What it checks |
|---|---|
| `tests/report.spec.ts` | The page loads green, every row is present, rows open, contact links and the PDF download work, no sideways scrolling |
| `tests/bugs.spec.ts` | Each injected bug fails exactly one check with the right message, and recovers after the fix; the chaos monkey fails all six |
| `tests/i18n.spec.ts` | English and French, including failure messages, persistence after reload and the browser-language default |
| `tests/keyboard.spec.ts` | Keyboard shortcuts, and using the page without a mouse |
| `tests/motion.spec.ts` | Reduced motion is respected, the opt-in works, and bugs are still caught on the same run |
| `tests/a11y.spec.ts` | No WCAG 2.2 AA violations (axe) in the passing, failing and French states |

Selectors live in one page object, `tests/pages/cv-page.ts`.

The suite runs in four projects: Chromium, Firefox, WebKit and a phone profile (Pixel 7).

## Running it

Requires Node 20 or newer.

```bash
npm ci
npx playwright install chromium firefox webkit
npm test
```

Other commands:

```bash
npm run test:local   # Chromium, WebKit and the phone profile only
npm run test:ui      # Playwright's interactive UI mode
npm run report       # open the last HTML report
npm run serve        # serve the site on http://localhost:4173
```

## Stack

- The site: plain HTML, CSS and JavaScript, no framework and no build step
- The tests: Playwright Test with TypeScript, plus axe-core for accessibility
- CI: GitHub Actions, with the HTML report uploaded as an artifact on every run

## Two things the tests found

- With reduced motion switched on, three of the page's own checks read stale values and reported a bug one run late. Fixed, and covered by `motion.spec.ts`.
- The language button's accessible name did not contain its visible text (WCAG 2.5.3). Found by axe, fixed.
