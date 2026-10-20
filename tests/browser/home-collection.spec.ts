import { test, expect, type Page } from '@playwright/test';
import games from '../../data/games.json' with { type: 'json' };

const sledGames = games.filter(game => game.category.includes('sledding-games'));

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
  test(`editorial home catalog works at ${viewport.width}px without JavaScript`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      await mockExternalResources(page);
      await page.goto('/');
      const collection = page.locator('main .editorial-note');
      await expect(collection.getByRole('heading', { name: 'Find your next winter game', exact: true })).toBeVisible();
      await expect(collection.locator('p a')).toHaveCount(games.length + 4);
      await expect(page.locator('main .home-collection, main .game-card--compact')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Browse every winter game', exact: true })).toHaveCount(0);
      await expect(page.locator('main .game-card')).toHaveCount(sledGames.length);
      await expect(page.locator('.page-intro h1')).toHaveText('Sled Games');
      await expect(page.locator('.featured-games .game-card')).toHaveCount(sledGames.length);
      expect(await page.locator('main').evaluate(main => {
        const sections = Array.from(main.children);
        const guide = sections.findIndex(section => section.matches('.hub-guide'));
        const blocks = sections.filter(section => section.matches('section, article'));
        return guide >= 0 && sections[guide + 1]?.matches('.editorial-note')
          && sections[guide + 2]?.matches('.faq')
          && !!sections[guide + 3]?.querySelector('.category-grid')
          && blocks.at(-1) === sections[guide + 3];
      })).toBe(true);
      expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await expect(collection.locator('img, .game-card')).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}.png`), fullPage: true, animations: 'disabled' });
      await collection.scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`home-editorial-${viewport.width}.png`), animations: 'disabled' });
      for (const game of games) {
        const link = collection.getByRole('link', { name: game.title, exact: true });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAttribute('href', `/${game.slug}/`);
        await link.click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321/${game.slug}/`);
        await expect(page.locator('main h1')).toHaveText(['snow-riders', 'scroll-and-spot', 'xmas-triple-mahjong'].includes(game.slug) ? game.seoTitle! : game.title);
        if (!game.embed.iframeSrc) {
          await expect(page.locator('main iframe, [data-game-tools]')).toHaveCount(0);
          await expect(page.locator('.game-external a')).toHaveAttribute('href', game.externalPlayUrl!);
          await expect(page.locator('.game-external a')).toHaveAttribute('target', '_blank');
        }
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await page.goto('/');
      }
      await collection.getByRole('link', { name: 'full winter collection', exact: true }).click();
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
            const firstShortcut = games.find(game => game.slug !== 'sled-rider')!;
            await expect(page.locator(`.quick-links a[href="/${firstShortcut.slug}/"]`)).toBeFocused();
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
