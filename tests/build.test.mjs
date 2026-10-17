import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { load } from 'cheerio';
import { allPaths, canonical, games, gameFaqs, gamePath, embedUrl, categories, categoryGames, gameCategory, winterCollection } from '../src/lib/catalog.mjs';
import astroConfig from '../astro.config.mjs';

const pageFile = path => path === '/' ? 'dist/index.html' : path === '/404' ? 'dist/404.html' : `dist${path}/index.html`;
const adSenseSrc = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5598323555742768';
const googleTagSrc = 'https://www.googletagmanager.com/gtag/js?id=G-NX4YF4WPRK';

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
    assert.ok(description.length >= 130 && description.length <= 160, `${path}: description has ${description.length} characters`);
    assert.ok(!descriptions.has(description), `${path}: duplicate description`);
    descriptions.add(description);
    assert.equal($('link[rel="canonical"]').attr('href'), canonical(path));
    assert.equal($('meta[property="og:url"]').attr('content'), canonical(path));
    assert.equal($('meta[property="og:title"]').attr('content'), title);
    assert.equal($('meta[property="og:description"]').attr('content'), description);
    assert.ok($('main').text().trim().length > 100, `${path}: missing static content`);
    const visibleText = $('body').clone().find('script, style').remove().end().text();
    assert.doesNotMatch(visibleText, /coming[-\s]+soon|getting\s+ready|\bempty\b|on\s+(?:the|its)\s+way|being\s+prepared|while\s+you\s+wait/i, `${path}: placeholder copy`);
    const adSense = $(`script[src="${adSenseSrc}"]`);
    assert.equal(adSense.length, 1, `${path}: exactly one AdSense script with the configured publisher`);
    assert.ok(adSense.parent().is('head'), `${path}: AdSense script belongs in the head`);
    assert.ok(adSense.is('[async]'));
    assert.equal(adSense.attr('crossorigin'), 'anonymous');
    const googleTag = $(`script[src="${googleTagSrc}"]`);
    const googleTagConfig = googleTag.next('script');
    assert.equal(googleTag.length, 1, `${path}: exactly one Google tag`);
    assert.ok(googleTag.parent().is('head'), `${path}: Google tag belongs in the head`);
    assert.ok(googleTag.is('[async]'));
    assert.match(googleTagConfig.text(), /gtag\('config', 'G-NX4YF4WPRK'\)/);
    assert.equal($('head script').first().get(0), googleTag.get(0), `${path}: Google tag precedes other scripts`);
    if (!$('iframe').length) {
      const scripts = $('script:not([type="application/ld+json"])').not(adSense).not(googleTag).not(googleTagConfig);
      assert.equal(scripts.length, path === '/' ? 1 : 0, `${path}: only the home random-game navigation needs a client script`);
    }
    assert.ok($('[data-ad-slot]').length <= 3);
    $('a[href^="/"]').each((_, link) => {
      const target = $(link).attr('href').split('#')[0];
      assert.ok(allPaths.includes(target), `${path}: broken internal link ${target}`);
    });
  }
});

test('game cards name their play destination and reserve Play now for the home primary action', () => {
  for (const path of [...allPaths, '/404']) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    const visibleText = $('body').clone().find('script, style').remove().end().text();
    assert.equal((visibleText.match(/\bPlay now\b/g) ?? []).length, path === '/' ? 1 : 0, `${path}: generic play copy is reserved for the home primary action`);
    if (path === '/') {
      const primaryAction = $('main .page-intro a[data-random-game]');
      assert.equal(primaryAction.length, 1);
      assert.equal(primaryAction.clone().find('[aria-hidden]').remove().end().text().trim(), 'Play now');
    }
    $('main .game-card:not(.game-card--compact)').each((_, node) => {
      const card = $(node);
      const game = games.find(game => gamePath(game.slug) === card.attr('href'));
      assert.ok(game, `${path}: a game card must have a catalog destination`);
      assert.equal(card.find('.card-badge').length, 1, `${path}: ${game.title} has one play label`);
      assert.equal(card.find('.card-badge').text(), `Play ${game.title}`, `${path}: the play label identifies ${game.title}`);
    });
  }
});

test('full game cards use distinct contextual descriptions across pages', () => {
  const appearances = new Map(games.map(game => [game.slug, []]));
  for (const path of [...allPaths, '/404']) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    $('main .game-card:not(.game-card--compact)').each((_, node) => {
      const card = $(node);
      const game = games.find(game => gamePath(game.slug) === card.attr('href'));
      assert.ok(game, `${path}: a game card must have a catalog destination`);
      const paragraphs = card.find('.card-copy > p');
      const description = paragraphs.text().trim().replace(/\s+/g, ' ');
      assert.equal(paragraphs.length, 1, `${path}: ${game.title} has one card description`);
      assert.ok(description, `${path}: ${game.title} has useful preview copy`);
      assert.notEqual(description, game.description, `${path}: ${game.title} does not repeat its metadata`);
      assert.doesNotMatch(description, /^Play .+? online for free\b/i, `${path}: ${game.title} avoids the generic catalog opening`);
      appearances.get(game.slug).push({ path, description, firstSentence: description.split(/[.!?](?:\s+|$)/, 1)[0] });
    });
  }
  for (const [slug, entries] of appearances) {
    assert.ok(entries.length >= 3, `${slug}: compare descriptions on at least three pages`);
    for (const field of ['description', 'firstSentence']) {
      const seen = new Map();
      for (const entry of entries) {
        assert.ok(!seen.has(entry[field]), `${slug}: ${field} repeats between ${seen.get(entry[field])} and ${entry.path}`);
        seen.set(entry[field], entry.path);
      }
    }
  }
});

test('main heading outlines keep collection headings between page and card titles', () => {
  for (const path of [...allPaths, '/404']) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    const headings = $('main h1, main h2, main h3').toArray();
    assert.equal(headings[0]?.tagName, 'h1', `${path}: the page title starts the outline`);
    let previousLevel = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName.slice(1));
      assert.ok(level <= previousLevel + 1, `${path}: ${$(heading).text()} skips from H${previousLevel} to H${level}`);
      previousLevel = level;
    }
  }
});

test('sitemap lists every public page and excludes the 404 page', () => {
  const $ = load(readFileSync('dist/sitemap.xml', 'utf8'), { xml: true });
  assert.deepEqual($('loc').map((_, item) => $(item).text()).get().sort(), allPaths.map(canonical).sort());
  assert.equal($('loc').length, 20);
  assert.equal($('loc').filter((_, item) => $(item).text() === canonical('/sled-rider/')).length, 1);
  assert.equal(astroConfig.trailingSlash, 'always');
  $('loc').each((_, item) => assert.ok($(item).text().endsWith('/')));
  assert.ok(allPaths.every(path => path.endsWith('/')));
  assert.match(readFileSync('dist/robots.txt', 'utf8'), /Allow: \/\n/);
  assert.match(readFileSync('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/sledgames\.com\/sitemap\.xml/);
});

test('the homepage is a static sledding hub with matching featured games and collection FAQs', () => {
  const $ = load(readFileSync(pageFile('/'), 'utf8'));
  const entries = categoryGames('sledding-games');
  assert.equal($('title').text(), 'Sled Games - Play Free Sledding Games Online');
  assert.equal($('meta[name="description"]').attr('content'), 'Play free sled games in your web browser. Ride a sled down snowy slopes, then explore our snowboard, ski, and Christmas game pages.');
  assert.equal($('h1').text(), 'Sled Games');
  assert.equal($('iframe, .game-stage, .game-guide, .guide-nav, #about-game, #how-to-play, #game-tips').length, 0);
  assert.equal($('body.play-first').length, 0);
  assert.equal(entries.length, 2);
  const cards = $('main .featured-games .game-card');
  assert.deepEqual(cards.map((_, card) => $(card).attr('href')).get(), entries.map(game => gamePath(game.slug)));
  assert.equal($('main .game-card').length, entries.length + games.length, 'The homepage has its featured sledding cards and the compact catalog');
  cards.each((_, card) => assert.equal($(card).find('img').attr('loading'), 'eager'));
  const mainSections = $('main').find('.featured-games, .category-grid').toArray();
  assert.equal(mainSections.length, 2);
  assert.ok($(mainSections[0]).hasClass('featured-games'), 'Featured sledding games precede category entries');
  const random = $('a[data-random-game]');
  assert.equal(random.length, 1);
  assert.equal(random.attr('href'), '/sled-rider/');
  assert.ok(random.text().trim());
  assert.equal($('main a[href="/about/"]').length, 1);
  const prose = $('main').text();
  for (const heading of ['What are sled games?', 'How to pick a sled game', 'Sled games for beginners', 'FAQs']) {
    assert.ok($('h2').toArray().some(node => $(node).text() === heading), heading);
  }
  assert.doesNotMatch(prose, /Play Sled Rider above|guide on this page|Sled Rider: how to play and improve/);
  const faqs = $('details').toArray().map(node => ({ q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text(), a: $(node).find('p').text() }));
  assert.deepEqual(faqs.map(faq => faq.q), [
    'What are the best free sled games to play online?',
    'Do I need to download anything to play sled games?',
    'Can I play sled games on a phone?',
    'What is the difference between a sled game and a snowboard game?',
    'Are these sled games free?',
  ]);
  assert.ok(faqs.every(faq => faq.a.trim()));
  const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
  assert.deepEqual(schemas.map(schema => schema['@type']).sort(), ['FAQPage', 'ItemList', 'WebSite']);
  assert.equal(schemas.find(schema => schema['@type'] === 'WebSite').url, canonical('/'));
  const list = schemas.find(schema => schema['@type'] === 'ItemList');
  assert.equal(list.name, 'Sled Games');
  assert.deepEqual(list.itemListElement.map(item => ({ position: item.position, name: item.name, url: item.url })), entries.map((game, index) => ({ position: index + 1, name: game.title, url: canonical(gamePath(game.slug)) })));
  assert.deepEqual(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity, faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })));
});

test('the homepage compact catalog follows the shared catalog without duplicating directory descriptions', () => {
  const $ = load(readFileSync(pageFile('/'), 'utf8'));
  const collection = $('main .home-collection');
  assert.equal(collection.length, 1);
  assert.equal(collection.prev().is('article.hub-guide'), true, 'The guide immediately precedes the compact collection');
  assert.equal(collection.next().is('section.faq'), true, 'The FAQs immediately follow the compact collection');
  assert.equal(collection.attr('aria-labelledby'), 'every-winter-game');
  assert.equal(collection.find('h2#every-winter-game').text(), 'Browse every winter game');
  assert.equal(collection.find('.collection-more a').attr('href'), '/games/');
  assert.equal(collection.find('.collection-more a').text(), 'See the full winter collection');
  const cards = collection.find('.game-grid.game-grid--compact > a.game-card.game-card--compact');
  assert.deepEqual(cards.map((_, card) => $(card).attr('href')).get(), games.map(game => gamePath(game.slug)));
  cards.each((index, node) => {
    const card = $(node);
    const game = games[index];
    assert.equal(card.find('h3').clone().find('[aria-hidden]').remove().end().text(), game.title);
    assert.equal(card.find('.card-category').text(), gameCategory(game).label);
    assert.equal(card.find('img').attr('src'), game.thumbnail);
    assert.equal(card.find('img').attr('width'), '480');
    assert.equal(card.find('img').attr('height'), '300');
    assert.equal(card.find('img').attr('loading'), 'lazy');
    assert.equal(card.find('img').attr('alt'), '');
    assert.equal(card.find('p, .card-badge').length, 0, `${game.slug}: compact cards omit descriptions and play labels`);
    assert.doesNotMatch(card.text(), /Play now/);
  });
  const featured = categoryGames('sledding-games');
  for (const game of games) {
    assert.equal($(`main a.game-card[href="${gamePath(game.slug)}"]`).length, featured.includes(game) ? 2 : 1, `${game.slug}: card count`);
  }
  assert.equal($('main .game-card--compact').length, games.length);
});

test('Sled Rider uses its verified player without fabricated ratings or prices', () => {
  const game = games.find(game => game.slug === 'sled-rider');
  const $ = load(readFileSync(pageFile('/sled-rider/'), 'utf8'));
  assert.equal($('title').text(), 'Sled Rider - Play the Free Sledding Game Online');
  assert.equal($('meta[name="description"]').attr('content'), 'Play Sled Rider online for free. Steer your sled down a snowy hill, dodge trees and rocks, collect gifts, and unlock new sleds in your browser.');
  assert.equal($('meta[property="og:title"]').attr('content'), $('title').text());
  assert.equal($('h1').text(), 'Sled Rider');
  assert.ok(!$('h1').hasClass('sr-only'));
  assert.equal($('.game-stage').prev().get(0), $('h1').get(0));
  assert.equal($('iframe').length, 1);
  assert.equal($('iframe').attr('src'), 'https://gamea.azgame.io/sled-rider/');
  assert.equal($('iframe').attr('loading'), 'eager');
  assert.equal($('.game-pending').length, 0);
  assert.doesNotMatch($('main').text(), /coming soon/i);
  assert.equal($('.info-bar').length, 0);
  assert.equal($('.guide-controls table').length, 1);
  assert.deepEqual($('#about-game > p:not(.guide-meta)').map((_, node) => $(node).text()).get(), game.intro.split(/\n\s*\n/));
  assert.equal($('#about-game > p:not(.guide-meta)').length, 3);
  assert.match($('.guide-meta').text(), /Developer: AZGames/);
  for (const [selector, expected] of [['.guide-steps li', game.howToPlay], ['.guide-tips li', game.tips]]) {
    const actual = $(selector).map((_, node) => {
      const title = $(node).find('strong').text();
      return `${title ? `${title}: ` : ''}${$(node).find('p').text()}`;
    }).get();
    assert.deepEqual(actual, expected);
    assert.equal(actual.length, 5);
  }
  assert.deepEqual($('.guide-controls tbody tr').map((_, row) => ({ action: $(row).find('th').text(), input: $(row).find('td').text() })).get(), game.controls);
  $('.guide-nav a').each((_, link) => assert.equal($($(link).attr('href')).length, 1));
  const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
  const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, 5);
  assert.deepEqual(faq.mainEntity, gameFaqs(game).map(entry => ({ '@type': 'Question', name: entry.q, acceptedAnswer: { '@type': 'Answer', text: entry.a } })));
  for (const entry of faq.mainEntity) {
    assert.ok($('summary').toArray().some(summary => $(summary).text().startsWith(entry.name)));
    assert.ok($('details p').toArray().some(p => $(p).text() === entry.acceptedAnswer.text));
  }
  const schema = schemas.find(schema => schema['@type'] === 'VideoGame');
  assert.equal(schema.url, canonical('/sled-rider/'));
  assert.deepEqual(schema.author, { '@type': 'Organization', name: 'AZGames' });
  assert.ok(!schema.aggregateRating);
  assert.equal(schema.offers.price, 0);
});

test('Snow Rider 2 publishes the approved guide and the official Snow Rider 3D player', () => {
  const path = '/snow-rider-2/';
  const description = 'Play Snow Rider 2 online for free in your browser. Steer your sleigh down an endless snowy slope, dodge trees and rocks, and collect gifts.';
  const $ = load(readFileSync(pageFile(path), 'utf8'));
  assert.equal($('title').text(), 'Snow Rider 2 - Play the Sleigh Riding Game Online Free');
  assert.equal($('meta[name="description"]').attr('content'), description);
  assert.equal($('h1').text(), 'Snow Rider 2');
  assert.ok(!$('h1').hasClass('sr-only'));
  assert.equal($('#about-game > p:not(.guide-meta)').first().text(), 'The game in the window above is Snow Rider 3D, the sleigh-riding release published by GameBiz in the official GameDistribution catalog. It is the endless sledding game most players are looking for under the Snow Rider 2 name.');
  assert.match($('.guide-meta').text(), /Developer: GameBiz/);
  assert.match($('.guide-meta').text(), /Released: December 9, 2020/);
  assert.equal($('iframe').length, 1);
  const player = $('iframe');
  const src = new URL(player.attr('src'));
  assert.equal(src.origin, 'https://html5.gamedistribution.com');
  assert.equal(src.pathname, '/3b79a8537ebc414fb4f9672a9b8c68c8/');
  assert.deepEqual(src.searchParams.getAll('gd_sdk_referrer_url'), ['https://sledgames.com/snow-rider-2/']);
  for (const [attribute, value] of Object.entries({ title: 'Play Snow Rider 2', width: '800', height: '600', loading: 'eager', allow: 'fullscreen; autoplay; gamepad', referrerpolicy: 'strict-origin-when-cross-origin' })) {
    assert.equal(player.attr(attribute), value, attribute);
  }
  assert.ok(player.is('[allowfullscreen]'));
  assert.deepEqual($('.guide-controls tbody tr').toArray().map(row => [$(row).find('th').text(), $(row).find('td').text()]), [
    ['Jump', 'Up arrow key or W'],
    ['Steer left', 'Left arrow key or A'],
    ['Steer right', 'Right arrow key or D'],
  ]);
  assert.equal($('.guide-steps li').length, 4);
  assert.deepEqual($('.guide-steps li strong').map((_, node) => $(node).text()).get(), ['Start', 'Steer', 'Jump', 'Collect']);
  assert.equal($('.guide-tips li').length, 4);
  assert.deepEqual($('.guide-tips li strong').map((_, node) => $(node).text()).get(), ['Look further ahead', 'Small corrections', 'Jump early on gaps', 'Keep the run alive']);
  assert.equal($('#related-games h2#related-games-heading').text(), 'Explore More Winter Games');
  assert.equal($('.info-bar').length, 0);
  assert.doesNotMatch($('main').text(), /Items and prices/);

  const faqs = [
    { q: 'Is it free?', a: 'Yes, play in the game window above.' },
    { q: 'Is this Snow Rider 3D or Snow Rider 2?', a: 'The game window runs Snow Rider 3D, published by GameBiz in the official GameDistribution catalog. That is the sleigh-riding game usually searched for as Snow Rider 2.' },
    { q: 'Which keys do I use?', a: 'Up arrow or W to jump, left arrow or A to steer left, right arrow or D to steer right.' },
    { q: 'Can I play it on a phone?', a: 'The official catalog lists this game as compatible with iOS and Android browsers.' },
    { q: 'Do I need to install anything?', a: 'No, it runs in your browser.' },
  ];
  assert.deepEqual($('details').toArray().map(node => ({ q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text(), a: $(node).find('p').text() })), faqs);
  const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
  assert.equal(schemas.length, 3);
  const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity, faqs.map(entry => ({ '@type': 'Question', name: entry.q, acceptedAnswer: { '@type': 'Answer', text: entry.a } })));
  const game = schemas.find(schema => schema['@type'] === 'VideoGame');
  assert.equal(game.name, 'Snow Rider 2');
  assert.deepEqual(game.author, { '@type': 'Organization', name: 'GameBiz' });
  assert.equal(game.datePublished, '2020-12-09');
  assert.equal(game.applicationCategory, 'Game');
  assert.equal(game.operatingSystem, 'Web Browser');
  assert.ok(!game.aggregateRating);

  const collection = load(readFileSync(pageFile('/games/'), 'utf8'));
  const card = collection(`main .game-card[href="${path}"]`);
  assert.equal(card.length, 1);
  assert.equal(card.find('img').attr('src'), 'https://img.gamedistribution.com/3b79a8537ebc414fb4f9672a9b8c68c8-512x384.jpg');
  assert.notEqual(card.find('p').text(), description);
  assert.match(card.find('p').text(), /sled|sleigh/i, 'The collection card describes Snow Rider 2 gameplay');
  for (const category of ['/snowboard-games/', '/ski-games/']) {
    assert.equal(load(readFileSync(pageFile(category), 'utf8'))(`main .primary-collection .game-card[href="${path}"]`).length, 0, category);
  }
});

const approvedWinterGames = [
  {
    slug: 'snowball-io', name: 'Snowball.io',
    title: 'Snowball.io - Play the Snowball Fighting Game Online Free',
    description: 'Play Snowball.io online for free in your browser. Slide to grow your snowball, then roll over your opponents in this fast arena snowball fight.',
    embed: 'https://io.gamemonetize.com/snowwar/',
    thumbnail: 'https://img.gamemonetize.com/jdxrwawd43ij64lixz02uwhqnzmfjk2k/512x384.jpg',
    width: '960', height: '600', control: 'Use Mouse To Play and Keyboard',
    developer: 'JumpGame', released: '2022-06-06', releaseLabel: 'June 6, 2022',
  },
  {
    slug: 'moto-x3m-winter', name: 'Moto X3M Winter',
    title: 'Moto X3M Winter - Play the Frozen Bike Stunt Game Free',
    description: 'Play Moto X3M Winter online for free. Ride your stunt bike through icy ramps, loops and traps, and finish each level as fast as you can.',
    embed: 'https://html5.gamemonetize.co/1gjwgvl2j0ipdd9ybezeavu04y1nqjen/',
    thumbnail: 'https://img.gamemonetize.com/1gjwgvl2j0ipdd9ybezeavu04y1nqjen/512x384.jpg',
    width: '720', height: '480', control: 'User arrow keys to control',
    developer: 'MadPuffers', released: '2022-01-26', releaseLabel: 'January 26, 2022',
  },
];

for (const approved of approvedWinterGames) {
  test(`${approved.name} publishes the approved copy, official controls, and verified publisher player`, () => {
    const path = `/${approved.slug}/`;
    const gameData = games.find(game => game.slug === approved.slug);
    assert.ok(gameData);
    assert.equal(gameData.embed.provider, 'gamemonetize');
    assert.deepEqual(gameData.category, ['winter-games']);
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.equal($('title').text(), approved.title);
    assert.equal($('meta[name="description"]').attr('content'), approved.description);
    assert.equal($('h1').text(), approved.name);
    assert.ok(!$('h1').hasClass('sr-only'));
    assert.equal($('iframe').length, 1);
    assert.equal($('iframe').attr('src'), approved.embed);
    assert.equal($('iframe').attr('title'), `Play ${approved.name}`);
    assert.equal($('iframe').attr('width'), approved.width);
    assert.equal($('iframe').attr('height'), approved.height);
    assert.equal($('.guide-controls table').length, 1);
    assert.equal($('.guide-controls tbody tr').length, 1);
    assert.equal($('.guide-controls tbody td').text(), approved.control);
    assert.ok($('.guide-meta').text().includes(`Developer: ${approved.developer}`));
    assert.ok($('.guide-meta').text().includes(`Released: ${approved.releaseLabel}`));
    assert.equal($('.info-bar').length, 0);

    const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
    const game = schemas.find(schema => schema['@type'] === 'VideoGame');
    assert.equal(game.name, approved.name);
    assert.deepEqual(game.author, { '@type': 'Organization', name: approved.developer });
    assert.equal(game.datePublished, approved.released);
    assert.ok(!game.aggregateRating);
    const faqs = $('details').toArray().map(node => ({ q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text(), a: $(node).find('p').text() }));
    assert.equal(faqs.length, 5);
    assert.ok(faqs.every(entry => entry.q.trim() && entry.a.trim()));
    const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
    assert.deepEqual(faq.mainEntity, faqs.map(entry => ({ '@type': 'Question', name: entry.q, acceptedAnswer: { '@type': 'Answer', text: entry.a } })));
    const breadcrumb = schemas.find(schema => schema['@type'] === 'BreadcrumbList');
    assert.deepEqual(breadcrumb.itemListElement.map(entry => ({ name: entry.name, item: entry.item })), [
      { name: 'Sled Games', item: 'https://sledgames.com/' },
      { name: 'All Winter Games', item: 'https://sledgames.com/games/' },
      { name: approved.name, item: `https://sledgames.com${path}` },
    ]);

    const collection = load(readFileSync(pageFile('/games/'), 'utf8'));
    const card = collection(`main .game-card[href="${path}"]`);
    assert.equal(card.length, 1);
    assert.equal(card.find('img').attr('src'), approved.thumbnail);
    assert.equal(card.find('.card-category').text(), 'Winter');
    assert.notEqual(card.find('p').text(), approved.description);
    assert.match(card.find('p').text(), approved.slug === 'snowball-io' ? /snowball|arena/i : /motorcycle|bike|stunt/i, `${approved.name}: the collection preview describes its gameplay`);
    for (const category of ['/snowboard-games/', '/ski-games/']) {
      assert.equal(load(readFileSync(pageFile(category), 'utf8'))(`main .primary-collection .game-card[href="${path}"]`).length, 0, category);
    }
  });
}

test('every dedicated game page puts the eager player before every ad', () => {
  for (const game of games) {
    const path = gamePath(game.slug);
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.equal($('iframe').attr('src'), embedUrl(game, canonical(path)));
    assert.equal($('iframe').attr('loading'), 'eager');
    assert.equal($('body.play-first').length, 1);
    assert.equal($('h1.play-heading').length, 1, `${path}: visible game heading`);
    assert.equal($('.game-stage').prev().get(0), $('h1').get(0));
    assert.equal($('.game-stage [data-ad-slot]').length, 0);
    assert.equal($('.game-stage').prevAll('[data-ad-slot]').length, 0);
    assert.equal($('.game-stage').nextAll('[data-ad-slot]').length, $('[data-ad-slot]').length);
  }
});

test('winter categories link to their playable games with matching official artwork', () => {
  for (const category of ['snowboard-games', 'ski-games', 'christmas-games']) {
    const entries = categoryGames(category);
    assert.ok(entries.length >= 2, `${category}: at least two games`);
    const $ = load(readFileSync(pageFile(`/${category}`), 'utf8'));
    assert.equal($(`header nav[aria-label="Main navigation"] > span[aria-current="page"]`).text(), categories.find(entry => entry.slug === category).title);
    assert.equal($(`header nav a[href="/${category}/"]`).length, 0);
    assert.equal($('h1').text(), category === 'christmas-games' ? 'Christmas Games' : category === 'ski-games' ? 'Ski Games' : 'Snowboard Games');
    const collection = $('main .primary-collection');
    assert.equal(collection.length, 1, `${category}: one main category collection`);
    const collectionHeading = collection.find('h2');
    assert.equal(collectionHeading.length, 1, `${category}: one visible collection heading`);
    assert.equal(collection.attr('aria-labelledby'), collectionHeading.attr('id'));
    assert.equal(collectionHeading.text(), category === 'christmas-games' ? 'Choose your Christmas game' : category === 'ski-games' ? 'Choose your ski game' : 'Choose your snowboard game');
    assert.equal(collection.find('.game-card').length, entries.length);
    for (const game of entries) {
      const card = collection.find(`.game-card[href="${gamePath(game.slug)}"]`);
      assert.equal(card.length, 1);
      assert.equal(card.find('img').attr('src'), game.thumbnail);
      assert.equal(card.find('.card-badge').text(), `Play ${game.title}`);
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
      assert.equal(detail('details').length, game.faqs.length);
      assert.ok(entries.some(other => other.slug !== game.slug && detail(`.game-card[href="${gamePath(other.slug)}"]`).length));
    }
  }
});

test('winter games are reachable from the full collection and separate category recommendations', () => {
  const newPaths = ['/snow-rider-2/', '/snowball-io/', '/moto-x3m-winter/'];
  const recommendationPaths = ['/sled-rider/', ...newPaths];
  for (const path of ['/games/', '/snowboard-games/', '/ski-games/', '/christmas-games/']) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    for (const game of newPaths) {
      assert.equal($(`main .game-card[href="${game}"]`).length, 1, `${path}: one card for ${game}`);
    }
    if (path === '/games/') continue;
    const recommendations = $('main section[aria-labelledby="other-winter-games"]');
    assert.equal(recommendations.length, 1, `${path}: one recommendation section`);
    assert.equal(recommendations.find('h2#other-winter-games').text(), 'Explore More Winter Games');
    assert.equal(recommendations.closest('.primary-collection').length, 0, `${path}: recommendations are separate from the sport collection`);
    assert.deepEqual(recommendations.find('.game-card').map((_, node) => $(node).attr('href')).get().sort(), [...recommendationPaths].sort(), path);
  }
});

test('new winter game pages link to one another in their related-game sections', () => {
  const newPaths = ['/snow-rider-2/', '/snowball-io/', '/moto-x3m-winter/'];
  for (const path of newPaths) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    const related = $('main section.related-games#related-games');
    assert.equal(related.length, 1, `${path}: one related-game section`);
    assert.equal(related.find('.game-grid').length, 1, `${path}: one related-game grid`);
    const cards = related.find('.game-grid .game-card');
    const targets = cards.map((_, card) => $(card).attr('href')).get();
    assert.equal(new Set(targets).size, targets.length, `${path}: related cards must be unique`);
    assert.equal(cards.filter(`[href="${path}"]`).length, 0, `${path}: no related card links to itself`);
    for (const other of newPaths.filter(other => other !== path)) {
      assert.equal(cards.filter(`[href="${other}"]`).length, 1, `${path}: one related card for ${other}`);
    }
  }
});

test('each game is reachable from at least three different existing pages', () => {
  for (const game of games) {
    const sources = allPaths.filter(path => path !== gamePath(game.slug) && load(readFileSync(pageFile(path), 'utf8'))(`a[href="${gamePath(game.slug)}"]`).length);
    assert.ok(sources.length >= 3, `${game.slug}: only ${sources.length} incoming pages`);
  }
});

test('Sled Rider is an indexable dedicated page without any homepage redirect mechanism', () => {
  assert.ok(allPaths.includes('/sled-rider/'));
  assert.equal(allPaths.length, 20);
  assert.equal(new Set(allPaths).size, allPaths.length);
  const $ = load(readFileSync(pageFile('/sled-rider/'), 'utf8'));
  assert.equal($('iframe, .game-guide').length, 2);
  assert.equal($('link[rel="canonical"]').attr('href'), canonical('/sled-rider/'));
  assert.equal($('meta[http-equiv="refresh"]').length, 0);
  assert.equal($('meta[name="robots"]').filter((_, node) => /noindex/i.test($(node).attr('content'))).length, 0);
  assert.doesNotMatch($('script').text(), /location\.(?:replace|assign)|location(?:\.href)?\s*=/);
  const redirects = existsSync('dist/_redirects') ? readFileSync('dist/_redirects', 'utf8') : '';
  const sourceRedirects = existsSync('public/_redirects') ? readFileSync('public/_redirects', 'utf8') : '';
  assert.doesNotMatch(redirects, /^\/sled-rider\/?\s/m);
  assert.doesNotMatch(sourceRedirects, /^\/sled-rider\/?\s/m);
  assert.ok(!Object.keys(astroConfig.redirects ?? {}).some(source => /^\/sled-rider(?:\/|$)/.test(source)));
  // Cloudflare adapters append configured Astro redirects to this file.
  // Validate the combined rules, including duplicates across both sources.
  const sources = redirects.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => line.split(/\s+/)[0]);
  sources.push(...Object.keys(astroConfig.redirects ?? {}));
  assert.equal(new Set(sources).size, sources.length, 'Cloudflare redirect sources must be unique, including adapter-generated rules');
});

test('game links use their dedicated pages while the brand and sledding category keep the homepage', () => {
  for (const path of [...allPaths, '/404']) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.equal($('.game-card[href="/"]').length, 0, `${path}: no game card points to the homepage`);
    $('a').filter((_, node) => $(node).text().trim() === 'Sled Rider').each((_, node) => {
      assert.equal($(node).attr('href'), '/sled-rider/', `${path}: Sled Rider anchor`);
    });
    const sledCategory = $('header nav[aria-label="Main navigation"] > *').filter((_, node) => $(node).text().trim() === 'Sled Games');
    assert.equal(sledCategory.get(0).tagName, path === '/' ? 'span' : 'a');
    assert.equal(sledCategory.attr('href'), path === '/' ? undefined : '/');
    const rootCategory = $('.category-card--sledding-games');
    if (rootCategory.length) assert.equal(rootCategory.attr('href'), '/');
    const shortcut = $('.quick-links a[href="/sled-rider/"]');
    assert.equal(shortcut.length, path === '/sled-rider/' ? 0 : 1);
    assert.equal(shortcut.attr('aria-current'), undefined);
    const currentGame = games.find(game => gamePath(game.slug) === path);
    const currentShortcut = $('.quick-links > span[aria-current="page"]');
    assert.equal(currentShortcut.length, currentGame ? 1 : 0);
    if (currentGame) assert.equal(currentShortcut.text(), currentGame.title);
  }
});

test('SEO titles match the approved copy without changing the SnowBoard Game title', () => {
  const expected = {
    '/downhill-snowboard/': 'Downhill Snowboard - Play the Free Snowboarding Game Online',
    '/ski-king/': 'Ski King - Play the Free Online Downhill Skiing Game',
    '/ski-rush/': 'Ski Rush - Play the Free Online Ski Survival Game',
    '/santa-collecting-gifts/': 'Santa Collecting Gifts - Play the Free Online Sleigh Game',
    '/crazy-christmas-fun/': 'Crazy Christmas Fun - Play Free Santa & Reindeer Sleigh Game',
    '/snowboard-game/': 'SnowBoard Game - Play the Snowboarding Game Online Free',
    '/christmas-games/': 'Christmas Games - Play Free Santa & Sleigh Games Online',
    '/games/': 'All Winter Games - Play Free Snowboard, Ski & Christmas Games Online',
  };
  for (const [path, title] of Object.entries(expected)) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.equal($('title').text(), title, path);
    assert.equal($('meta[property="og:title"]').attr('content'), title, path);
  }
});

test('category and game breadcrumbs describe their real hierarchy with canonical URLs', () => {
  const trails = [
    ...categories.filter(category => category.path !== '/').map(category => [category.path, [{ name: category.title, path: category.path }]]),
    ['/games/', [{ name: winterCollection.title, path: winterCollection.path }]],
    ...games.map(game => {
      const category = gameCategory(game);
      const collection = category.path === '/' ? winterCollection : category;
      return [gamePath(game.slug), [{ name: collection.title, path: collection.path }, { name: game.title, path: gamePath(game.slug) }]];
    }),
  ];
  for (const [path, trail] of trails) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    const schemas = $('head script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
    const breadcrumbs = schemas.filter(schema => schema['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumbs.length, 1, path);
    assert.deepEqual(breadcrumbs[0].itemListElement, [{ name: 'Sled Games', path: '/' }, ...trail].map((entry, index) => ({
      '@type': 'ListItem', position: index + 1, name: entry.name, item: canonical(entry.path),
    })), path);
    for (const item of breadcrumbs[0].itemListElement) assert.ok(allPaths.includes(new URL(item.item).pathname));
  }
});

test('winter game list schema matches card order and includes a useful collection guide', () => {
  const $ = load(readFileSync(pageFile('/games/'), 'utf8'));
  const schemas = $('head script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
  const list = schemas.find(schema => schema['@type'] === 'ItemList');
  assert.equal(list.name, 'All Winter Games');
  assert.equal($('h1').text(), list.name);
  assert.equal(list.itemListElement.length, games.length);
  const cards = $('main .game-card').toArray();
  list.itemListElement.forEach((item, index) => {
    assert.equal(item['@type'], 'ListItem');
    assert.equal(item.position, index + 1);
    assert.equal(item.name, games[index].title);
    assert.equal(item.url, canonical($(cards[index]).attr('href')));
  });
  const words = $('section[aria-labelledby="winter-games-guide"] p').toArray().map(node => $(node).text()).join(' ').trim().split(/\s+/).length;
  assert.ok(words >= 200 && words <= 300, `Collection guide has ${words} words`);
});

test('header shortcuts and footer game links include the full data-driven catalog on every page', () => {
  for (const path of allPaths) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    assert.deepEqual($('.quick-links > a, .quick-links > span[aria-current="page"]').map((_, node) => $(node).text()).get(), games.map(game => game.title), path);
    assert.deepEqual($('.quick-links a').map((_, node) => $(node).attr('href')).get(), games.filter(game => gamePath(game.slug) !== path).map(game => gamePath(game.slug)), path);
    assert.deepEqual($('footer nav[aria-label="Game links"] a').slice(1).map((_, node) => $(node).attr('href')).get(), games.map(game => gamePath(game.slug)), path);
  }
});

test('shared navigation renders only the current URL as a noninteractive span and preserves every footer link', () => {
  for (const path of [...allPaths, '/404']) {
    const $ = load(readFileSync(pageFile(path), 'utf8'));
    const nav = $('header nav[aria-label="Main navigation"]');
    const entries = [...categories, { path: '/games/', title: 'All Games' }];
    assert.equal(nav.children().length, entries.length);
    entries.forEach((entry, index) => {
      const item = nav.children().eq(index);
      const isCurrent = path === entry.path;
      assert.equal(item.get(0).tagName, isCurrent ? 'span' : 'a', `${path}: ${entry.title} tag`);
      assert.equal(item.clone().find('[aria-hidden]').remove().end().text().trim(), entry.title, `${path}: label`);
      assert.equal(item.attr('href'), isCurrent ? undefined : entry.path, `${path}: ${entry.title} target`);
      assert.equal(item.attr('aria-current'), isCurrent ? 'page' : undefined, `${path}: current status`);
    });
    $('header span[aria-current="page"]').each((_, node) => {
      assert.equal($(node).attr('href'), undefined);
      assert.equal($(node).attr('tabindex'), undefined);
      assert.equal($(node).attr('role'), undefined);
      assert.equal($(node).attr('onclick'), undefined);
    });
    assert.equal($('footer span[aria-current="page"]').length, 0);
    const footer = $('footer nav[aria-label="Game links"]');
    assert.equal(footer.find('a[href="/games/"]').length, 1);
    assert.equal($('footer .brand[href="/"]').length, 1);
  }
});
