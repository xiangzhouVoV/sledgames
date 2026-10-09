import { test, expect } from '@playwright/test';

for (const width of [320, 390, 1280]) {
  test(`static navigation and game layout at ${width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.route('https://gamea.azgame.io/**', route => route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' }));
    await page.goto('http://127.0.0.1:4321/');
    await expect(page.locator('h1')).toHaveText('Sled Games');
    expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
    const stage = await page.locator('.game-stage').boundingBox();
    expect(stage!.width).toBeLessThanOrEqual(width);
    expect(stage!.y + stage!.height).toBeLessThanOrEqual(900);
    if (width < 600) expect(Math.abs(stage!.width / stage!.height - 1.6)).toBeLessThan(.03);
    await page.locator('main a[href="/sled-rider"]').first().click();
    await expect(page.locator('h1')).toHaveText('Sled Rider');
    const gameStage = await page.locator('.game-stage').boundingBox();
    expect(gameStage!.y + gameStage!.height).toBeLessThanOrEqual(900);
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
  await expect(page.locator('main a[href="/sled-rider"]')).toBeVisible();
});

test('player reload and fullscreen work without leaving the page', async ({ page }) => {
  let loads = 0;
  await page.route('https://gamea.azgame.io/**', route => {
    loads++;
    return route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' });
  });
  await page.goto('/sled-rider');
  await expect.poll(() => loads).toBe(1);
  await page.getByRole('button', { name: 'Reload Sled Rider' }).click();
  await expect.poll(() => loads).toBe(2);
  await page.getByRole('button', { name: 'Play Sled Rider in fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('game-stage');
  await page.evaluate(() => document.exitFullscreen());
  await expect(page).toHaveURL(/\/sled-rider$/);
});
