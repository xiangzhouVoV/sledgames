import { test, expect, type Page } from '@playwright/test';

const player = 'https://html5.gamemonetize.co/4jlpcom1sy0z4thlimget2ew3z6ow05d/';
const fixture = 'SnowBoard Game player fixture';
const questions = [
  'Is SnowBoard Game free?',
  'Do I need to download anything?',
  'What are the controls?',
  'Can I play it on my phone?',
  'Is it unblocked at school or work?',
  "What's the difference between SnowBoard Game and Downhill Snowboard?",
  'Who made SnowBoard Game?',
];

async function mockExternalResources(page: Page) {
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === 'http://127.0.0.1:4321') return route.continue();
    if (request.resourceType() === 'document' && request.url() === player) {
      return route.fulfill({ contentType: 'text/html', body: `<html><body>${fixture}</body></html>` });
    }
    if (request.resourceType() === 'image') {
      return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>' });
    }
    // Ads, analytics, and any other remote requests are never needed for this guide.
    return route.abort();
  });
}

async function expectNoHorizontalOverflow(page: Page, width: number) {
  expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`SnowBoard Game guide, anchors, and FAQs work without JavaScript at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      await mockExternalResources(page);
      const response = await page.goto('/snowboard-game/');
      expect(response!.status()).toBe(200);
      expect(response!.request().redirectedFrom()).toBeNull();
      await expect(page).toHaveTitle('SnowBoard Game - Winter Racing Game Online');
      await expect(page.locator('main h1')).toHaveText('SnowBoard Game');
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.game-stage > iframe')).toHaveAttribute('src', player);
      await expect(page.frameLocator('.game-stage > iframe').locator('body')).toHaveText(fixture);
      await expect(page.locator('article.game-guide')).toHaveCount(1);
      await expect(page.locator('.guide-steps li strong')).toHaveText(['Start', 'Move', 'Steer', 'Grab', 'Finish']);
      await expect(page.locator('.guide-tips li')).toHaveCount(5);
      await expect(page.locator('.quick-links span[aria-current="page"]')).toHaveText('SnowBoard Game');
      await expectNoHorizontalOverflow(page, viewport.width);

      for (const id of ['about-game', 'how-to-play', 'game-tips']) {
        await page.locator(`.guide-nav a[href="#${id}"]`).click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321/snowboard-game/#${id}`);
        await expect(page.locator(`#${id}`)).toBeInViewport();
        await expectNoHorizontalOverflow(page, viewport.width);
      }

      for (const section of [
        { id: 'snowboard-unblocked', heading: 'Is SnowBoard Game unblocked?' },
        { id: 'snowboard-comparison', heading: 'SnowBoard Game vs Downhill Snowboard' },
      ]) {
        await page.goto(`/snowboard-game/#${section.id}`);
        const heading = page.locator(`#${section.id}`).getByRole('heading', { level: 2, name: section.heading, exact: true });
        await expect(heading).toBeVisible();
        await expect(heading).toBeInViewport();
        await expectNoHorizontalOverflow(page, viewport.width);
      }

      await expect(page.locator('.faq details')).toHaveCount(7);
      for (const question of questions) {
        const details = page.locator('.faq details').filter({ has: page.getByText(question, { exact: false }) });
        const summary = details.locator('summary');
        await expect(summary).toContainText(question);
        await expect(details.locator('p')).not.toBeVisible();
        await summary.click();
        await expect(details).toHaveAttribute('open', '');
        await expect(details.locator('p')).toBeVisible();
        await expectNoHorizontalOverflow(page, viewport.width);
      }

      for (const href of ['/downhill-snowboard/', '/snowboard-games/']) {
        await expect(page.locator(`#snowboard-comparison a[href="${href}"]`)).toHaveCount(1);
      }
    } finally {
      await context.close();
    }
  });
}

test('category and Downhill Snowboard cards open the expanded SnowBoard Game page', async ({ page }) => {
  await mockExternalResources(page);
  for (const source of ['/snowboard-games/', '/downhill-snowboard/']) {
    await page.goto(source);
    const card = page.locator('main .game-card[href="/snowboard-game/"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator('h3')).toContainText('SnowBoard Game');
    await expect(card.locator('p')).toContainText('SnowBoard Game');
    await card.click();
    await expect(page).toHaveURL('http://127.0.0.1:4321/snowboard-game/');
    await expect(page.locator('main h1')).toHaveText('SnowBoard Game');
    await expect(page.frameLocator('.game-stage > iframe').locator('body')).toHaveText(fixture);
    await expect(page.locator('#snowboard-unblocked')).toHaveCount(1);
    await expect(page.locator('#snowboard-comparison')).toHaveCount(1);
    await expect(page.locator('.faq details')).toHaveCount(7);
  }
});
