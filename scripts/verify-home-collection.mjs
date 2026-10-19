import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { load } from 'cheerio';

// Verify the current static collection. An optional saved build also checks that
// expansion preserves its public URLs and page headings:
// node scripts/verify-home-collection.mjs [BASELINE_DIRECTORY] [REPORT_JSON]
const baseline = process.argv[2] ?? process.env.HOME_COLLECTION_BASELINE;
const beforeRoot = baseline ? resolve(baseline) : null;
const afterRoot = process.cwd();
const checks = [];
const read = (root, path) => readFileSync(join(root, path), 'utf8');
const check = (name, verify) => {
  try { verify(); checks.push({ name, passed: true }); }
  catch (error) { checks.push({ name, passed: false, error: error.message }); }
};
function files(root, extension) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? files(join(root, entry.name), extension).map(path => join(entry.name, path))
    : entry.name.endsWith(extension) ? [entry.name] : []);
}
const games = JSON.parse(read(afterRoot, 'data/games.json'));
const sledGames = games.filter(game => game.category.includes('sledding-games'));
const gamePaths = games.map(game => `/${game.slug}/`);
const sledPaths = sledGames.map(game => `/${game.slug}/`);
const canonical = path => new URL(path, 'https://sledgames.com').href;
const pages = files(join(afterRoot, 'dist'), '.html');
const home = load(read(afterRoot, 'dist/index.html'));

check('Home features every sled game once, with no duplicate catalog cards', () => {
  assert.ok(sledGames.length >= 2, 'The sled collection needs multiple choices');
  const cards = home('main .featured-games a.game-card');
  assert.deepEqual(cards.map((_, node) => home(node).attr('href')).get(), sledPaths);
  assert.equal(home('main a.game-card').length, sledGames.length);
  assert.equal(home('main .home-collection, main .game-card--compact').length, 0);
  cards.each((index, node) => {
    const card = home(node);
    if (sledGames[index].thumbnail) {
      assert.equal(card.find('.card-art > img').length, 1);
      assert.equal(card.find('img').attr('loading'), 'eager');
      assert.equal(card.find('img').attr('src'), sledGames[index].thumbnail);
    } else {
      assert.equal(card.find('img').length, 0, 'Inline vector artwork needs no thumbnail request');
      assert.equal(card.find('.card-art > svg.card-scene').length, 1);
    }
    assert.equal(card.find('.card-badge').text(), `Play ${sledGames[index].title}`);
  });
});
check('Home stays a static hub with one category heading and a working fallback action', () => {
  assert.equal(home('main h1').text(), 'Sled Games');
  assert.equal(home('main iframe, main .game-stage, main .game-guide, main .guide-nav').length, 0);
  assert.equal(home('main a[data-random-game]').length, 1);
  assert.equal(home('main a[data-random-game]').attr('href'), sledPaths[0]);
  assert.equal(home('link[rel="canonical"]').attr('href'), canonical('/'));
  const description = home('meta[name="description"]').attr('content');
  assert.match(description, /sled games/i);
  assert.ok(description.length >= 130 && description.length <= 160);
});
check('Home keeps featured games before its guide, editorial links, FAQs and final category navigation', () => {
  const blocks = home('main').children('section, article').toArray();
  const index = selector => blocks.findIndex(node => home(node).is(selector));
  const featured = index('.featured-games');
  const guide = index('.hub-guide');
  const editorial = index('.editorial-note');
  const faq = index('.faq');
  const categories = blocks.findIndex(node => home(node).find('.category-grid').length);
  assert.ok(featured >= 0 && featured < guide);
  assert.equal(editorial, guide + 1);
  assert.equal(faq, editorial + 1);
  assert.equal(categories, faq + 1);
  assert.equal(categories, blocks.length - 1);
  const collection = home('main .editorial-note');
  assert.equal(collection.length, 1);
  assert.equal(collection.find('img, .game-card').length, 0);
  assert.deepEqual(collection.find('p a').filter((_, node) => gamePaths.includes(home(node).attr('href'))).map((_, node) => home(node).attr('href')).get(), gamePaths);
});
check('Home ItemList and FAQ schema match the visible collection and answers', () => {
  const schemas = home('script[type="application/ld+json"]').toArray().map(node => JSON.parse(home(node).text()));
  assert.deepEqual(schemas.map(schema => schema['@type']).sort(), ['FAQPage', 'ItemList', 'WebSite']);
  const list = schemas.find(schema => schema['@type'] === 'ItemList');
  assert.equal(list.name, 'Sled Games');
  assert.deepEqual(list.itemListElement.map(item => ({ position: item.position, name: item.name, url: item.url })), sledGames.map((game, index) => ({ position: index + 1, name: game.title, url: canonical(`/${game.slug}/`) })));
  const faqs = home('main .faq details').toArray().map(node => ({
    '@type': 'Question',
    name: home(node).find('summary').clone().find('[aria-hidden]').remove().end().text(),
    acceptedAnswer: { '@type': 'Answer', text: home(node).find('p').text() },
  }));
  assert.ok(faqs.length > 0 && faqs.every(faq => faq.name.trim() && faq.acceptedAnswer.text.trim()));
  assert.deepEqual(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity, faqs);
});

for (const path of pages) {
  const $ = load(read(afterRoot, join('dist', path)));
  const publicPath = path === 'index.html' ? '/' : `/${path.replace(/\/index\.html$/, '/')}`;
  check(`${path}: shared game navigation matches the complete catalog`, () => {
    const shortcuts = $('header .quick-links');
    assert.equal(shortcuts.length, 1);
    const links = shortcuts.find('a').map((_, node) => $(node).attr('href')).get();
    const currentGame = games.find(game => `/${game.slug}/` === publicPath);
    assert.deepEqual(links, gamePaths.filter(gamePath => gamePath !== publicPath));
    assert.equal(shortcuts.find('span[aria-current="page"]').length, currentGame ? 1 : 0);
    if (currentGame) assert.equal(shortcuts.find('span[aria-current="page"]').text(), currentGame.title);
    $('header [aria-current="page"]').each((_, node) => {
      assert.equal(node.tagName, 'span');
      assert.equal($(node).attr('href'), undefined);
      assert.equal($(node).attr('tabindex'), undefined);
    });
  });
  check(`${path}: footer keeps all game destinations and site information`, () => {
    assert.deepEqual($('footer nav[aria-label="Game links"] a').map((_, node) => $(node).attr('href')).get(), ['/games/', ...gamePaths]);
    assert.deepEqual($('footer nav[aria-label="Site information"] a').map((_, node) => $(node).attr('href')).get(), ['/about/', '/contact/', '/privacy-policy/', '/terms-of-use/', '/copyright/']);
    assert.equal($('footer [aria-current="page"]').length, 0);
  });
  check(`${path}: no placeholder copy`, () => {
    const copy = $('body').clone().find('script,style').remove().end().text();
    assert.doesNotMatch(copy, /coming[-\s]+soon|\bempty\b|on\s+(?:the|its)\s+way/i);
  });
}

if (beforeRoot) {
  const oldPages = files(join(beforeRoot, 'dist'), '.html');
  check('Collection expansion preserves existing public pages', () => {
    for (const path of oldPages) assert.ok(pages.includes(path), `Removed page: ${path}`);
  });
  for (const path of oldPages.filter(path => existsSync(join(afterRoot, 'dist', path)))) {
    check(`${path}: existing H1 remains unchanged`, () => {
      const before = load(read(beforeRoot, join('dist', path)));
      const after = load(read(afterRoot, join('dist', path)));
      assert.deepEqual(after('main h1').map((_, node) => after(node).text()).get(), before('main h1').map((_, node) => before(node).text()).get());
      assert.equal(after('link[rel="canonical"]').attr('href'), before('link[rel="canonical"]').attr('href'));
    });
  }
}
const report = { baseline: beforeRoot, checkedAt: new Date().toISOString(), passed: checks.every(check => check.passed), checks };
if (process.argv[3]) {
  const reportPath = resolve(process.argv[3]);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
