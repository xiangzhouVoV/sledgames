import { test, expect, type Page } from '@playwright/test';
import games from '../../data/games.json' with { type: 'json' };
import { games as catalogGames, relatedGames } from '../../src/lib/catalog.mjs';

const publisherPattern = /^https:\/\/(?:gamea\.azgame\.io|html5\.(?:gamedistribution\.com|gamemonetize\.(?:com|co|games))|io\.gamemonetize\.com)\//;

async function mockHomepageResources(page: Page) {
  await page.route(publisherPattern, route => route.request().resourceType() === 'image'
    ? route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' })
    : route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
  await page.route(/^https:\/\/img\.(gamedistribution|gamemonetize)\.com\//, route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`homepage remains a static sled collection at ${viewport.width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport });
    try {
      const page = await context.newPage();
      const publisherRequests: string[] = [];
      page.on('request', request => {
        if (publisherPattern.test(request.url()) && request.resourceType() !== 'image') publisherRequests.push(request.url());
      });
      await mockHomepageResources(page);
      const response = await page.goto('/');
      expect(response!.status()).toBe(200);
      await expect(page).toHaveTitle('Sled Games - Play Free Sledding Games Online');
      await expect(page.locator('main h1')).toHaveText('Sled Games');
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('iframe, .game-stage, [data-game-tools]')).toHaveCount(0);
      const featured = page.locator('section.featured-games');
      await expect(featured.locator('.game-card')).toHaveCount(2);
      for (const slug of ['sled-rider', 'snow-rider-2']) {
        await expect(featured.locator(`.game-card[href="/${slug}/"]`)).toHaveCount(1);
      }
      expect(await featured.evaluate(section => {
        const categories = document.querySelector('main .category-grid');
        return !!categories && !!(section.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING);
      })).toBe(true);
      await expect(page.locator('main .game-card')).toHaveCount(2 + games.length);
      await expect(page.locator('.quick-links a')).toHaveCount(games.length);
      await expect(page.locator('header nav[aria-label="Main navigation"] > span[aria-current="page"]')).toHaveText('Sled Games');
      await expect(page.locator('header nav[aria-label="Main navigation"] a[href="/"]')).toHaveCount(0);
      await expect(page.locator('.quick-links a[href="/sled-rider/"]')).not.toHaveAttribute('aria-current', 'page');
      await expect(page.locator('.faq details')).toHaveCount(5);
      const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent!)));
      expect(schemas.map(schema => schema['@type']).sort()).toEqual(['FAQPage', 'ItemList', 'WebSite']);
      const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
      expect(itemList.itemListElement.map((item: { url: string }) => item.url)).toEqual([
        'https://sledgames.com/sled-rider/',
        'https://sledgames.com/snow-rider-2/',
      ]);
      expect(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity).toHaveLength(5);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://sledgames.com/');
      await expect(page.locator('main .game-guide')).toHaveCount(0);
      expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      expect(publisherRequests).toEqual([]);

      const random = page.locator('a[data-random-game]');
      await expect(random).toHaveAttribute('href', '/sled-rider/');
      await random.click();
      await expect(page).toHaveURL('http://127.0.0.1:4321/sled-rider/');
      await expect(page.locator('main h1')).toHaveText('Sled Rider');
    } finally {
      await context.close();
    }
  });
}

for (const selection of [{ random: 0, slug: 'sled-rider', title: 'Sled Rider' }, { random: .99, slug: 'snow-rider-2', title: 'Snow Rider 2' }]) {
  test(`homepage random start selects ${selection.title} with JavaScript`, async ({ page }) => {
    const publisherRequests: string[] = [];
    page.on('request', request => {
      if (publisherPattern.test(request.url()) && request.resourceType() !== 'image') publisherRequests.push(request.url());
    });
    await mockHomepageResources(page);
    await page.addInitScript(value => { Math.random = () => value; }, selection.random);
    await page.goto('/');
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(publisherRequests).toEqual([]);
    const random = page.locator('a[data-random-game]');
    await expect(random).toHaveAttribute('href', '/sled-rider/');
    await random.click();
    await expect(page).toHaveURL(`http://127.0.0.1:4321/${selection.slug}/`);
    await expect(page.locator('main h1')).toHaveText(selection.title);
    await expect(page.frameLocator('.game-stage > iframe').locator('body')).toHaveText('Official player fixture');
  });
}

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
        await expect(page.locator('header nav[aria-label="Main navigation"] > span[aria-current="page"]')).toHaveText(category === 'snowboard-games' ? 'Snowboard Games' : category === 'ski-games' ? 'Ski Games' : 'Christmas Games');
        await expect(page.locator(`header nav a[href="/${category}/"]`)).toHaveCount(0);
        expect(await page.locator('html').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await expect(page.locator('main .primary-collection .game-card')).toHaveCount(entries.length);
        const card = page.locator(`main .primary-collection .game-card[href="/${game.slug}/"]`);
        await expect(card.locator('img')).toHaveAttribute('src', game.thumbnail!);
        await card.click();
        await expect(page).toHaveURL(`http://127.0.0.1:4321/${game.slug}/`);
        await expect(page.locator('h1.play-heading')).toHaveText(game.title);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('.quick-links')).toBeVisible();
        await expect(page.locator('.quick-links a')).toHaveCount(games.length - 1);
        await expect(page.locator('.quick-links > span[aria-current="page"]')).toHaveText(game.title);
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
        await expect(page.locator('details')).toHaveCount(game.faqs.length);
        const related = relatedGames(catalogGames.find(entry => entry.slug === game.slug)!);
        await expect(page.locator('#related-games .game-card')).toHaveCount(5);
        await expect(page.locator('#related-games .game-card').first()).toHaveAttribute('href', `/${related[0].slug}/`);
      }
    }
    await context.close();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`winter recommendations preserve category collections and open the new game at ${viewport.width}px without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport });
    const page = await context.newPage();
    await page.route('https://html5.gamemonetize.co/**', route => route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' }));
    await page.route(/^https:\/\/img\.(gamedistribution|gamemonetize)\.com\//, route => route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' }));
    for (const category of ['snowboard-games', 'ski-games', 'christmas-games']) {
      await page.goto(`/${category}/`);
      await expect(page.locator('main .primary-collection .game-card')).toHaveCount(games.filter(game => game.category.includes(category)).length);
      const recommendations = page.locator('main section[aria-labelledby="other-winter-games"]');
      await expect(recommendations.getByRole('heading', { name: 'Explore More Winter Games', exact: true })).toBeVisible();
      await expect(recommendations.locator('.game-card')).toHaveCount(4);
      for (const slug of ['sled-rider', 'snow-rider-2', 'snowball-io', 'moto-x3m-winter']) {
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
      await page.route(/^https:\/\//, route => {
        const type = route.request().resourceType();
        if (type === 'image') return route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="#cee7ff"/></svg>', contentType: 'image/svg+xml' });
        if (type === 'document') return route.fulfill({ body: '<html><body>Official player fixture</body></html>', contentType: 'text/html' });
        return route.abort();
      });
      const newGames = [
        { slug: 'snow-rider-2', title: 'Snow Rider 2' },
        { slug: 'snowball-io', title: 'Snowball.io' },
        { slug: 'moto-x3m-winter', title: 'Moto X3M Winter' },
      ];
      for (const source of newGames) {
        for (const target of newGames.filter(game => game.slug !== source.slug)) {
          await page.goto(`/${source.slug}/`);
          await expect(page.locator('main h1')).toHaveText(source.title);
          const related = page.locator('main section.related-games#related-games');
          await expect(related).toHaveCount(1);
          await expect(related.getByRole('heading', { level: 2, name: 'Explore More Winter Games', exact: true })).toHaveCount(1);
          await expect(related.locator('.game-card')).toHaveCount(5);
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
    await page.goto('/sled-rider/');
    await expect(page.locator('main h1')).toHaveText('Sled Rider');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.quick-links')).toBeVisible();
    await expect(page.locator('.quick-links a')).toHaveCount(games.length - 1);
    await expect(page.locator('.quick-links > span[aria-current="page"]')).toHaveText('Sled Rider');
    await expect(page.locator('.quick-links a[href="/sled-rider/"]')).toHaveCount(0);
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
    await expect(page).toHaveURL(/\/sled-rider\/#about-game$/);
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
    await expect(page.locator('header nav[aria-label="Main navigation"] > span[aria-current="page"]')).toContainText('All Games');
    await expect(page.locator('header nav[aria-label="Main navigation"] a[href="/games/"]')).toHaveCount(0);
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
  await expect(page.locator('main .game-card[href="/sled-rider/"]')).toBeVisible();
});

test('player reload and fullscreen work without leaving the page', async ({ page }) => {
  let loads = 0;
  await page.route('https://gamea.azgame.io/sled-rider/', route => {
    loads++;
    return route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' });
  });
  await page.goto('/sled-rider/');
  await expect.poll(() => loads).toBe(1);
  await page.getByRole('button', { name: 'Reload Sled Rider' }).click();
  await expect.poll(() => loads).toBe(2);
  await page.getByRole('button', { name: 'Play Sled Rider in fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('game-stage');
  await page.evaluate(() => document.exitFullscreen());
  await expect(page).toHaveURL('http://127.0.0.1:4321/sled-rider/');
});

test('Sled Rider direct links and collection cards open its complete independent game page', async ({ page }) => {
  await page.route('https://gamea.azgame.io/**', route => route.fulfill({ body: '<html><body>Game player fixture</body></html>', contentType: 'text/html' }));
  const response = await page.goto('/sled-rider/#about-game');
  expect(response!.status()).toBe(200);
  expect(response!.request().redirectedFrom()).toBeNull();
  await expect(page).toHaveURL('http://127.0.0.1:4321/sled-rider/#about-game');
  await expect(page).toHaveTitle('Sled Rider - Play the Free Sledding Game Online');
  await expect(page.locator('main h1')).toHaveText('Sled Rider');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://sledgames.com/sled-rider/');
  await expect(page.locator('meta[name="robots"][content*="noindex"], meta[http-equiv="refresh"]')).toHaveCount(0);
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  const original = games.find(game => game.slug === 'sled-rider')!;
  await expect(page.locator('#about-game > p:not(.guide-meta)')).toHaveText(original.intro.split(/\n\s*\n/));
  await expect(page.locator('.guide-meta')).toContainText('Developer: AZGames');
  await expect(page.locator('.guide-controls tbody tr')).toHaveCount(original.controls.length);
  await expect(page.locator('.guide-steps li')).toHaveCount(5);
  await expect(page.locator('.guide-tips li')).toHaveCount(5);
  await expect(page.locator('details')).toHaveCount(5);
  await expect(page.locator('.faq details > p')).toHaveText(original.faqs.map(faq => faq.a));
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent!)));
  const gameSchema = schemas.find(schema => schema['@type'] === 'VideoGame');
  expect(gameSchema).toMatchObject({ name: 'Sled Rider', url: 'https://sledgames.com/sled-rider/', author: { name: 'AZGames' } });
  expect(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity).toHaveLength(5);
  await page.goto('/games/');
  await expect(page).toHaveTitle('All Winter Games - Play Free Snowboard, Ski & Christmas Games Online');
  await page.locator('main .game-card[href="/sled-rider/"]').click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/sled-rider/');
  await expect(page.locator('body')).toHaveClass(/has-snow/);
  await expect(page.locator('.guide-tips li')).toHaveCount(5);
});
