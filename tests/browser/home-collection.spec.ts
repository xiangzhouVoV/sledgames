import { test, expect, type Page } from '@playwright/test';
import games from '../../data/games.json' with { type: 'json' };

async function mockExternalResources(page: Page) {
  await page.route(/^https:\/\//, route => {
    if (route.request().resourceType() === 'image') return route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#cee7ff"/></svg>',
      contentType: 'image/svg+xml',
    });
    if (route.request().resourceType() === 'document') return route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' });
    return route.abort();
  });
}

for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
  test(`compact home collection works at ${viewport.width}px without JavaScript`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      await mockExternalResources(page);
      await page.goto('/');
      const collection = page.locator('main .home-collection');
      await expect(collection.locator('.game-card--compact')).toHaveCount(games.length);
      await expect(page.locator('main .game-card')).toHaveCount(games.length + 2);
      await expect(page.locator('.page-intro h1')).toHaveText('Sled Games');
      await expect(page.locator('.featured-games .game-card')).toHaveCount(2);
      expect(await page.locator('main').evaluate(main => {
        const sections = Array.from(main.children);
        const guide = sections.findIndex(section => section.matches('.hub-guide'));
        return guide >= 0 && sections[guide + 1]?.matches('.home-collection') && sections[guide + 2]?.matches('.faq');
      })).toBe(true);
      expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      const gridColumns = await collection.locator('.game-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(gridColumns).toBeLessThanOrEqual(viewport.width === 375 ? 2 : 4);
      expect(gridColumns).toBeGreaterThanOrEqual(1);
      await collection.scrollIntoViewIfNeeded();
      expect(await collection.boundingBox()).not.toBeNull();
      await expect(collection.locator('p:not(.section-heading p):not(.collection-more), .card-badge')).toHaveCount(0);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}.png`), fullPage: true, animations: 'disabled' });
      for (const game of games) {
        const card = page.locator(`.home-collection a.game-card--compact[href="/${game.slug}/"]`);
        await expect(card.locator('img')).toHaveAttribute('src', game.thumbnail!);
        await card.click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321/${game.slug}/`);
        await expect(page.locator('main h1')).toHaveText(game.title);
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await page.goto('/');
      }
      await collection.locator('.collection-more a').click();
      await expect(page).toHaveURL('http://127.0.0.1:4321/games/');
      await expect(page.locator('main h1')).toHaveText('All Winter Games');
    } finally {
      await context.close();
    }
  });

  test(`current navigation items are plain nonfocusable spans at ${viewport.width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      await mockExternalResources(page);
      for (const path of ['/', '/games/', '/snowboard-games/', '/sled-rider/']) {
        await page.goto(path);
        const nav = page.locator('header nav[aria-label="Main navigation"]');
        const currentSpans = page.locator('header span[aria-current="page"]');
        await expect(currentSpans).toHaveCount(1);
        const current = currentSpans.first();
        await expect(current).not.toHaveAttribute('href');
        await expect(current).not.toHaveAttribute('tabindex');
        expect(await current.evaluate(el => (el as HTMLElement).tabIndex)).toBe(-1);
        await current.click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321${path}`);
        if (path === '/') {
          await expect(nav.locator('> span[aria-current="page"]')).toHaveText('Sled Games');
          await expect(nav.locator('a[href="/games/"]')).toContainText('All Games');
          await page.locator('header .brand').focus();
          await page.keyboard.press('Tab');
          await expect(nav.locator('a[href="/snowboard-games/"]')).toBeFocused();
        } else if (path === '/games/') {
          await expect(nav.locator('> span[aria-current="page"]')).toContainText('All Games');
          await expect(nav.locator('a[href="/"]')).toHaveText('Sled Games');
          await nav.locator('a[href="/christmas-games/"]').focus();
          await page.keyboard.press('Tab');
          await expect(page.locator('.quick-links a').first()).toBeFocused();
        } else {
          await expect(nav.locator('a[href="/"]')).toHaveText('Sled Games');
          await expect(nav.locator('a[href="/games/"]')).toContainText('All Games');
          if (path === '/sled-rider/') {
            await expect(page.locator('.quick-links > span[aria-current="page"]')).toHaveText('Sled Rider');
            await nav.locator('a[href="/games/"]').focus();
            await page.keyboard.press('Tab');
            await expect(page.locator('.quick-links a[href="/downhill-snowboard/"]')).toBeFocused();
          }
        }
        await expect(page.locator('footer nav[aria-label="Game links"] a')).toHaveCount(games.length + 1);
        await expect(page.locator('footer nav[aria-label="Game links"] a[href="/games/"]')).toHaveText('All Games');
        await expect(page.locator('footer span[aria-current="page"]')).toHaveCount(0);
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      }
    } finally {
      await context.close();
    }
  });
}
