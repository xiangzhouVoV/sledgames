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
    for (const category of ['snowboard-games', 'ski-games', 'christmas-games']) {
      const entries = games.filter(game => game.category.includes(category));
      for (const game of entries) {
        await page.goto(`/${category}/`);
        await expect(page.locator(`header nav a[href="/${category}/"]`)).toHaveAttribute('aria-current', 'page');
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await expect(page.locator('main .primary-collection .game-card')).toHaveCount(entries.length);
        const card = page.locator(`main .primary-collection .game-card[href="/${game.slug}/"]`);
        await expect(card.locator('img')).toHaveAttribute('src', game.thumbnail!);
        await card.click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321/${game.slug}/`);
        await expect(page.locator('h1.play-heading')).toHaveText(game.title);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('.quick-links')).toBeVisible();
        await expect(page.locator('.quick-links a')).toHaveCount(games.length);
        const heading = await page.locator('main h1').boundingBox();
        const stage = await page.locator('.game-stage').boundingBox();
        expect(stage!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
        expect(stage!.y - heading!.y - heading!.height).toBeLessThanOrEqual(12);
        expect(stage!.y + stage!.height).toBeLessThanOrEqual(viewport.height);
        await expect(page.locator('.game-stage > iframe')).toHaveAttribute('title', `Play ${game.title}`);
        await expect(page.locator('body')).toHaveClass(category === 'christmas-games' ? /christmas-page/ : /has-snow/);
        const src = new URL(await page.locator('.game-stage > iframe').getAttribute('src') as string);
        expect(src.href).toBe(game.embed.iframeSrc);
        expect(src.hostname).toBe('html5.gamemonetize.co');
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await page.getByRole('link', { name: 'How to play', exact: true }).click();
        await expect(page.locator('#how-to-play')).toBeInViewport();
        await expect(page.locator('.guide-controls')).toBeVisible();
        await expect(page.locator('details')).toHaveCount(5);
        await expect(page.locator(`.game-card[href="/${game.similar[0]}/"]`)).toHaveCount(1);
      }
    }
    await context.close();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`winter recommendations preserve sports collections and open the new game at ${viewport.width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport });
    const page = await context.newPage();
    await page.route('https://html5.gamemonetize.co/**', route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
    await page.route(/^https:\/\/img\.(gamedistribution|gamemonetize)\.com\//, route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
    for (const category of ['snowboard-games', 'ski-games']) {
      await page.goto(`/${category}/`);
      await expect(page.locator('main .primary-collection .game-card')).toHaveCount(games.filter(game => game.category.includes(category)).length);
      const recommendations = page.locator('main section[aria-labelledby="other-winter-games"]');
      await expect(recommendations.getByRole('heading', { name: 'Explore Other Winter Games', exact: true })).toBeVisible();
      await expect(recommendations.locator('.game-card')).toHaveCount(3);
      for (const slug of ['snow-rider-2', 'snowball-io', 'moto-x3m-winter']) {
        await expect(recommendations.locator(`.game-card[href="/${slug}/"]`)).toHaveCount(1);
      }
      expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await recommendations.locator('.game-card[href="/moto-x3m-winter/"]').click();
      await expect(page).toHaveURL('http://127.0.0.1:4321/moto-x3m-winter/');
      await expect(page.locator('main h1')).toHaveText('Moto X3M Winter');
    }
    await context.close();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`new winter game related cards link every new game at ${viewport.width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      await page.route(/^https:\/\/(?:html5\.(?:gamedistribution\.com|gamemonetize\.co)\/|io\.gamemonetize\.com\/snowwar\/)/, route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
      await page.route(/^https:\/\/img\.(gamedistribution|gamemonetize)\.com\//, route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
      const newGames = [
        { slug: 'snow-rider-2', title: 'Snow Rider 2' },
        { slug: 'snowball-io', title: 'Snowball.io' },
        { slug: 'moto-x3m-winter', title: 'Moto X3M Winter' },
      ];
      for (const source of newGames) {
        for (const target of newGames.filter(game => game.slug !== source.slug)) {
          await page.goto(`/${source.slug}/`);
          await expect(page.locator('main h1')).toHaveText(source.title);
          const related = page.locator('main section').filter({ has: page.getByRole('heading', { level: 2, name: 'Explore Other Winter Games', exact: true }) });
          await expect(related).toHaveCount(1);
          await expect(related.locator('.game-card')).toHaveCount(7);
          await expect(related.locator(`.game-card[href="/${source.slug}/"]`)).toHaveCount(0);
          expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
          const card = related.locator(`.game-card[href="/${target.slug}/"]`);
          await expect(card).toHaveCount(1);
          await card.click();
          await expect(page).toHaveURL(`http://127.0.0.1:4321/${target.slug}/`);
          await expect(page.locator('main h1')).toHaveText(target.title);
          await expect(page.locator('main h1')).toBeVisible();
          await expect(page.frameLocator('.game-stage > iframe').locator('body')).toHaveText('Official player fixture');
          expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        }
      }
    } finally {
      await context.close();
    }
  });
}

for (const { width, height } of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 768 }, { width: 1280, height: 720 }, { width: 844, height: 390 }]) {
  test(`static navigation and game layout at ${width}x${height}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width, height } });
    const page = await context.newPage();
    await page.route('https://gamea.azgame.io/**', route => route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' }));
    await page.goto('http://127.0.0.1:4321/');
    await expect(page.locator('main h1')).toHaveText('Sled Games - Play Sled Rider');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.quick-links')).toBeVisible();
    await expect(page.locator('.quick-links a')).toHaveCount(games.length);
    const heading = await page.locator('main h1').boundingBox();
    const headingStyles = await page.locator('main h1').evaluate(el => { const style = getComputedStyle(el); return { size: parseFloat(style.fontSize), top: parseFloat(style.marginTop), bottom: parseFloat(style.marginBottom) }; });
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

for (const width of [320, 390, 1280]) {
  test(`all-game navigation scrolls to every game at ${width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.route('https://html5.gamemonetize.co/**', route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
    await page.route('https://img.gamemonetize.com/**', route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
    await page.route('https://html5.gamedistribution.com/**', route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
    await page.route('https://img.gamedistribution.com/**', route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
    await page.goto('/games/');
    await expect(page.locator('header nav[aria-label="Main navigation"] a[href="/games/"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('main .game-card')).toHaveCount(games.length);
    await expect(page.locator('.quick-links')).toBeVisible();
    const lastGame = games[games.length - 1];
    await page.locator(`.quick-links a[href="/${lastGame.slug}/"]`).click();
    await expect(page).toHaveURL(`http://127.0.0.1:4321/${lastGame.slug}/`);
    await expect(page.locator('h1.play-heading')).toHaveText(lastGame.title);
    expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
    await context.close();
  });
}

for (const game of [
  { slug: 'snow-rider-2', title: 'Snow Rider 2', playerPattern: 'https://html5.gamedistribution.com/**', fixtureText: 'Snow Rider 3D player fixture', faq: 'Is this Snow Rider 3D or Snow Rider 2?', answer: 'The game window runs Snow Rider 3D, published by GameBiz', portrait: false, fitted: false, aspectRatio: 800 / 600 },
  { slug: 'snowball-io', title: 'Snowball.io', playerPattern: 'https://io.gamemonetize.com/snowwar/**', fixtureText: 'Snowball.io player fixture', faq: 'Which controls do I use?', answer: 'Use Mouse To Play and Keyboard', portrait: false, fitted: true, aspectRatio: 960 / 600 },
  { slug: 'moto-x3m-winter', title: 'Moto X3M Winter', playerPattern: 'https://html5.gamemonetize.co/**', fixtureText: 'Moto X3M Winter player fixture', faq: 'Which controls do I use?', answer: 'User arrow keys to control', portrait: false, fitted: true, aspectRatio: 720 / 480 },
]) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    test(`${game.title} opens from its collection card with working guide navigation at ${viewport.width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.route(game.playerPattern, route => route.fulfill({ body: `<html><body>${game.fixtureText}</body></html>`, contentType: 'text/html' }));
      await page.route(/^https:\/\/img\.(gamedistribution|gamemonetize)\.com\//, route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
      await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
      await page.goto('/games/');
      await page.locator(`main .game-card[href="/${game.slug}/"]`).click();
      await expect(page).toHaveURL(`http://127.0.0.1:4321/${game.slug}/`);
      await expect(page.locator('h1.play-heading')).toHaveText(game.title);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.frameLocator('.game-stage > iframe').locator('body')).toHaveText(game.fixtureText);
      const player = new URL(await page.locator('.game-stage > iframe').getAttribute('src') as string);
      if (player.hostname === 'html5.gamedistribution.com') expect(player.searchParams.getAll('gd_sdk_referrer_url')).toEqual(['https://sledgames.com/snow-rider-2/']);
      expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      const heading = await page.locator('main h1').boundingBox();
      const stage = await page.locator('.game-stage').boundingBox();
      expect(stage!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
      expect(stage!.y + stage!.height).toBeLessThanOrEqual(viewport.height);
      if (game.fitted) {
        if (game.portrait) expect(stage!.height).toBeGreaterThan(stage!.width);
        else expect(stage!.width).toBeGreaterThan(stage!.height);
        expect(Math.abs(stage!.width / stage!.height - game.aspectRatio)).toBeLessThan(.02);
      }
      await page.getByRole('link', { name: 'How to play', exact: true }).click();
      await expect(page.locator('#how-to-play')).toBeInViewport();
      await page.getByRole('link', { name: 'Tips and strategy', exact: true }).click();
      await expect(page.locator('#game-tips')).toBeInViewport();
      const faq = page.locator('details').filter({ hasText: game.faq });
      await faq.locator('summary').click();
      await expect(faq.locator('p')).toBeVisible();
      await expect(faq.locator('p')).toContainText(game.answer);
      expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      if (game.fitted) {
        await page.getByRole('button', { name: `Play ${game.title} in fullscreen` }).click();
        await expect.poll(() => page.evaluate(() => document.fullscreenElement?.classList.contains('game-stage--fitted'))).toBe(true);
        const fullscreenStage = await page.locator('.game-stage').boundingBox();
        expect(fullscreenStage!.width).toBe(viewport.width);
        expect(fullscreenStage!.height).toBe(viewport.height);
        await page.evaluate(() => document.exitFullscreen());
      }
      await context.close();
    });
  }
}

test('missing pages return a useful 404', async ({ page }) => {
  const response = await page.goto('/missing-game/');
  expect(response!.status()).toBe(404);
  await expect(page.locator('main h1')).toHaveText('A fresh start?');
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
  await page.goto('/sled-rider/#about-game');
  await expect(page).toHaveURL('http://127.0.0.1:4321/#about-game');
  await expect(page.locator('main h1')).toHaveText('Sled Games - Play Sled Rider');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-steps li')).toHaveCount(5);
  await expect(page.locator('details')).toHaveCount(5);
  await page.goto('/games/');
  await page.locator('main .game-card[href="/"]').click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-tips li')).toHaveCount(5);
});
