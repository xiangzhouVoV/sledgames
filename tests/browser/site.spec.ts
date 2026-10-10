import { test, expect } from '@playwright/test';
import games from '../../data/games.json' with { type: 'json' };

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`category cards open the correct official players at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.route('https://html5.gamedistribution.com/**', route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
    await page.route('https://html5.gamemonetize.co/**', route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
    await page.route('https://img.gamedistribution.com/**', route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
    await page.route('https://img.gamemonetize.com/**', route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
    for (const category of ['snowboard-games', 'ski-games']) {
      const entries = games.filter(game => game.category.includes(category));
      for (const game of entries) {
        await page.goto(`/${category}`);
        await expect(page.locator('main .game-card')).toHaveCount(entries.length);
        const card = page.locator(`main .game-card[href="/${game.slug}"]`);
        await expect(card.locator('img')).toHaveAttribute('src', game.thumbnail!);
        await card.click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321/${game.slug}`);
        await expect(page.locator('iframe')).toHaveAttribute('title', `Play ${game.title}`);
        const src = new URL(await page.locator('iframe').getAttribute('src') as string);
        expect(src.href).toBe(game.embed.iframeSrc);
        expect(src.hostname).toBe('html5.gamemonetize.co');
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await page.getByRole('link', { name: 'How to play', exact: true }).click();
        await expect(page.locator('#how-to-play')).toBeInViewport();
        await expect(page.locator('.guide-controls')).toBeVisible();
        await expect(page.locator('details')).toHaveCount(5);
        await expect(page.locator(`.game-card[href="/${game.similar[0]}"]`)).toHaveCount(1);
      }
    }
    await context.close();
  });
}

for (const { width, height } of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 768 }, { width: 1280, height: 720 }, { width: 844, height: 390 }]) {
  test(`static navigation and game layout at ${width}x${height}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width, height } });
    const page = await context.newPage();
    await page.route('https://gamea.azgame.io/**', route => route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' }));
    await page.goto('http://127.0.0.1:4321/');
    await expect(page.locator('h1')).toHaveText('Play Sled Rider');
    await expect(page.locator('h1')).toBeVisible();
    const heading = await page.locator('h1').boundingBox();
    const headingStyles = await page.locator('h1').evaluate(el => { const style = getComputedStyle(el); return { size: parseFloat(style.fontSize), top: parseFloat(style.marginTop), bottom: parseFloat(style.marginBottom) }; });
    expect(headingStyles.size).toBeGreaterThanOrEqual(20);
    expect(headingStyles.size).toBeLessThanOrEqual(28);
    expect(headingStyles.top).toBeLessThanOrEqual(12);
    expect(headingStyles.bottom).toBeLessThanOrEqual(12);
    expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
    const stage = await page.locator('.game-stage').boundingBox();
    expect(stage!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
    expect(stage!.y - heading!.y - heading!.height).toBeLessThanOrEqual(12);
    expect(stage!.width).toBeLessThanOrEqual(width);
    expect(stage!.y + stage!.height).toBeLessThanOrEqual(height);
    if (width < 600) expect(Math.abs(stage!.width / stage!.height - 1.6)).toBeLessThan(.03);
    await expect(page.locator('body')).toHaveClass(/has-snow/);
    await expect(page.locator('.guide-steps li')).toHaveCount(5);
    await expect(page.locator('.guide-tips li')).toHaveCount(5);
    await page.locator('.guide-nav a[href="#about-game"]').click();
    await expect(page).toHaveURL(/\/#about-game$/);
    await expect(page.locator('#about-game')).toBeInViewport();
    await page.locator('details summary').first().click();
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    await expect(page.locator('details').first().locator('p')).toBeVisible();
    expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
    await context.close();
  });
}

test('missing pages return a useful 404', async ({ page }) => {
  const response = await page.goto('/missing-game');
  expect(response!.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('A fresh start?');
  await expect(page.locator('main .game-card[href="/"]')).toBeVisible();
});

test('player reload and fullscreen work without leaving the page', async ({ page }) => {
  let loads = 0;
  await page.route('https://gamea.azgame.io/sled-rider/', route => {
    loads++;
    return route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' });
  });
  await page.goto('/');
  await expect.poll(() => loads).toBe(1);
  await page.getByRole('button', { name: 'Reload Sled Rider' }).click();
  await expect.poll(() => loads).toBe(2);
  await page.getByRole('button', { name: 'Play Sled Rider in fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('game-stage');
  await page.evaluate(() => document.exitFullscreen());
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
});

test('legacy game links and game cards lead to the same complete homepage', async ({ page }) => {
  await page.route('https://gamea.azgame.io/**', route => route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' }));
  await page.goto('/sled-rider#about-game');
  await expect(page).toHaveURL('http://127.0.0.1:4321/#about-game');
  await expect(page.locator('h1')).toHaveText('Play Sled Rider');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-steps li')).toHaveCount(5);
  await expect(page.locator('details')).toHaveCount(5);
  await page.goto('/games');
  await page.locator('main .game-card[href="/"]').click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-tips li')).toHaveCount(5);
});
