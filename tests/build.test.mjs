import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { load } from 'cheerio';
import { allPaths, canonical, games, gameFaqs, gamePath, embedUrl, categoryGames } from '../src/lib/catalog.mjs';
import astroConfig from '../astro.config.mjs';

const pageFile = path => path === '/' ? 'dist/index.html' : path === '/404' ? 'dist/404.html' : `dist${path}/index.html`;

test('all pages have static content, unique metadata, and working internal links', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const path of [...allPaths, '/404']) {
    assert.ok(existsSync(pageFile(path)), `Missing ${path}`);
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.equal($('html').attr('lang'), 'en');
    assert.equal($('h1').length, 1, `${path}: exactly one H1`);
    const title = $('title').text();
    assert.ok(!titles.has(title), `Duplicate title: ${title}`);
    titles.add(title);
    const description = $('meta[name="description"]').attr('content');
    assert.ok(description.length >= 140 && description.length <= 160, `${path}: description has ${description.length} characters`);
    assert.ok(!descriptions.has(description), `${path}: duplicate description`);
    descriptions.add(description);
    assert.equal($('link[rel="canonical"]').attr('href'), canonical(path));
    assert.ok($('main').text().trim().length > 100, `${path}: missing static content`);
    const visibleText = $('body').clone().find('script, style').remove().end().text();
    assert.doesNotMatch(visibleText, /coming[-\s]+soon|getting\s+ready|\bempty\b|on\s+(?:the|its)\s+way|being\s+prepared|while\s+you\s+wait/i, `${path}: placeholder copy`);
    if (!$('iframe').length) assert.equal($('script:not([type="application/ld+json"])').length, 0, `${path}: content pages should not need client scripts`);
    assert.ok($('[data-ad-slot]').length <= 3);
    $('a[href^="/"]').each((_, link) => {
      const target = $(link).attr('href').split('#')[0];
      assert.ok(allPaths.includes(target), `${path}: broken internal link ${target}`);
    });
  }
});

test('sitemap lists every public page and excludes the 404 page', () => {
  const $ = load(readFileSync('dist/sitemap.xml', 'utf8'), { xml: true });
  assert.deepEqual($('loc').map((_, item) => $(item).text()).get().sort(), allPaths.map(canonical).sort());
  assert.match(readFileSync('dist/robots.txt', 'utf8'), /Allow: \/\n/);
  assert.match(readFileSync('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/sledgames\.com\/sitemap\.xml/);
});

test('Sled Rider uses its verified player without fabricated ratings or prices', () => {
  const $ = load(readFileSync('dist/index.html', 'utf8'));
  assert.equal($('title').text(), 'Sled Games - Play Sled Rider Online Free | Sledding Games');
  assert.equal($('meta[property="og:title"]').attr('content'), $('title').text());
  assert.equal($('h1').text(), 'Play Sled Rider');
  assert.ok(!$('h1').hasClass('sr-only'));
  assert.equal($('.game-stage').prev().get(0), $('h1').get(0));
  assert.equal($('iframe').length, 1);
  assert.equal($('iframe').attr('src'), 'https://gamea.azgame.io/sled-rider/');
  assert.equal($('iframe').attr('loading'), 'eager');
  assert.equal($('.game-pending').length, 0);
  assert.doesNotMatch($('main').text(), /coming soon/i);
  assert.equal($('.info-bar').length, 0);
  assert.equal($('.guide-controls table').length, 1);
  assert.equal($('#about-game > p:not(.guide-meta)').length, 3);
  assert.equal($('.guide-steps li').length, games[0].howToPlay.length);
  assert.equal($('.guide-tips li').length, games[0].tips.length);
  assert.equal($('.guide-controls tbody tr').length, games[0].controls.length);
  $('.guide-nav a').each((_, link) => assert.equal($($(link).attr('href')).length, 1));
  const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
  const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, gameFaqs(games[0]).length);
  for (const entry of faq.mainEntity) {
    assert.ok($('summary').toArray().some(summary => $(summary).text().startsWith(entry.name)));
    assert.ok($('details p').toArray().some(p => $(p).text() === entry.acceptedAnswer.text));
  }
  const schema = schemas.find(schema => schema['@type'] === 'VideoGame');
  assert.equal(schema.url, canonical('/'));
  assert.ok(!schema.aggregateRating);
  assert.equal(schema.offers.price, 0);
});

test('home and game pages put the eager player before every ad', () => {
  for (const game of games) {
    const path = gamePath(game.slug);
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.equal($('iframe').attr('src'), embedUrl(game, canonical(path)));
    assert.equal($('iframe').attr('loading'), 'eager');
    assert.equal($('body.play-first').length, 1);
    assert.equal($('.game-stage [data-ad-slot]').length, 0);
    assert.equal($('.game-stage').prevAll('[data-ad-slot]').length, 0);
    assert.equal($('.game-stage').nextAll('[data-ad-slot]').length, $('[data-ad-slot]').length);
  }
});

test('snowboard and ski categories link to their playable games with matching official artwork', () => {
  for (const category of ['snowboard-games', 'ski-games']) {
    const entries = categoryGames(category);
    assert.ok(entries.length >= 2, `${category}: at least two games`);
    const $ = load(readFileSync(pageFile(`/${category}`), 'utf8'));
    assert.equal($('.game-card').length, entries.length);
    for (const game of entries) {
      const card = $(`.game-card[href="${gamePath(game.slug)}"]`);
      assert.equal(card.length, 1);
      assert.equal(card.find('img').attr('src'), game.thumbnail);
      assert.equal(card.find('.card-badge').text(), 'Play now');
      const detail = load(readFileSync(pageFile(gamePath(game.slug)), 'utf8'));
      const player = new URL(detail('iframe').attr('src'));
      assert.equal(player.href, embedUrl(game, canonical(gamePath(game.slug))));
      assert.equal(player.hostname, 'html5.gamemonetize.co');
      assert.equal(player.pathname, new URL(game.embed.iframeSrc).pathname);
      assert.ok(!player.href.includes('{{PAGE_URL}}'));
      assert.ok(detail('#about-game p').length > 0);
      assert.ok(detail('.guide-steps li').length >= 3);
      assert.ok(detail('.guide-tips li').length >= 3);
      assert.ok(detail('.guide-controls tbody tr').length > 0);
      assert.equal(detail('details').length, 5);
      assert.ok(entries.some(other => other.slug !== game.slug && detail(`.game-card[href="${gamePath(other.slug)}"]`).length));
    }
  }
});

test('each game is reachable from at least three different existing pages', () => {
  for (const game of games) {
    const sources = allPaths.filter(path => path !== gamePath(game.slug) && load(readFileSync(pageFile(path), 'utf8'))(`a[href="${gamePath(game.slug)}"]`).length);
    assert.ok(sources.length >= 3, `${game.slug}: only ${sources.length} incoming pages`);
  }
});

test('Sled Rider is served only on the homepage with a permanent legacy redirect', () => {
  assert.ok(!allPaths.includes('/sled-rider'));
  const $ = load(readFileSync('dist/sled-rider/index.html', 'utf8'));
  assert.equal($('iframe, .game-guide').length, 0);
  assert.match($('meta[http-equiv="refresh"]').attr('content'), /url=\/$/);
  const redirects = readFileSync('dist/_redirects', 'utf8');
  assert.match(redirects, /^\/sled-rider \/ 301$/m);
  assert.match(redirects, /^\/sled-rider\/ \/ 301$/m);
  // Cloudflare adapters append configured Astro redirects to this file.
  // Validate the combined rules, including duplicates across both sources.
  const sources = redirects.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => line.split(/\s+/)[0]);
  sources.push(...Object.keys(astroConfig.redirects ?? {}));
  assert.equal(new Set(sources).size, sources.length, 'Cloudflare redirect sources must be unique, including adapter-generated rules');
});
