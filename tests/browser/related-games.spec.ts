import { test, expect, type Page } from '@playwright/test';
import { games, relatedGames, gamePath } from '../../src/lib/catalog.mjs';

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

for (const viewport of [{ width: 320, height: 568 }, { width: 1280, height: 800 }]) {
  test(`every detail has five readable related cards that navigate without JavaScript at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      await mockExternalResources(page);
      for (const source of games) {
        await page.goto(gamePath(source.slug));
        const section = page.locator('main section.related-games#related-games');
        await expect(section).toHaveCount(1);
        await expect(section).toHaveAttribute('aria-labelledby', 'related-games-heading');
        const heading = section.getByRole('heading', { level: 2, name: 'Explore More Winter Games', exact: true });
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeVisible();
        const cards = section.locator('.game-grid > a.game-card');
        const planned = relatedGames(source);
        await expect(cards).toHaveCount(5);
        expect(await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(planned.map(game => gamePath(game.slug)));
        for (let index = 0; index < planned.length; index++) {
          const card = cards.nth(index);
          const target = planned[index];
          await card.scrollIntoViewIfNeeded();
          await expect(card.getByRole('heading', { level: 3 })).toContainText(target.title);
          await expect(card.locator('.card-badge')).toHaveText(`Play ${target.title}`);
          await expect(card.locator('.card-copy > p')).toBeVisible();
          const clippedText = await card.locator('.card-badge, h3, .card-copy > p').evaluateAll(nodes => nodes.some(node => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1));
          expect(clippedText, `${source.slug}: card text fits at ${viewport.width}px`).toBe(false);
        }
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        if (['sled-rider', 'snow-rider-2'].includes(source.slug)) await expect(cards.first().locator('.card-category')).toHaveText('Sledding');
        const target = planned[0];
        await cards.first().click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321${gamePath(target.slug)}`);
        await expect(page.locator('main h1')).toHaveText(target.title);
      }
    } finally {
      await context.close();
    }
  });
}
