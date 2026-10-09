import { test, expect } from '@playwright/test';

for (const width of [320, 390, 1280]) {
  test(`static navigation and game layout at ${width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.route('https://gamea.azgame.io/**', route => route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' }));
    await page.goto('http://127.0.0.1:4321/');
    await expect(page.locator('h1')).toHaveText('Sled Games');
    expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
    const stage = await page.locator('.game-stage').boundingBox();
    expect(stage!.width).toBeLessThanOrEqual(width);
    expect(stage!.y + stage!.height).toBeLessThanOrEqual(900);
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
  await expect(page.locator('h1')).toHaveText('Sled Games');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-steps li')).toHaveCount(5);
  await expect(page.locator('details')).toHaveCount(5);
  await page.goto('/games');
  await page.locator('main .game-card[href="/"]').click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-tips li')).toHaveCount(5);
});
