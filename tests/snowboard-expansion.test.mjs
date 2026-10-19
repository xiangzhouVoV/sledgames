import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { allPaths, categoryGames, gamePath } from '../src/lib/catalog.mjs';

const additions = [
  {
    slug: 'snowboard-king-2024',
    title: 'Snowboard King 2024',
    player: 'https://html5.gamedistribution.com/ce6797fbf599415fa270487c9a384001/',
  },
  {
    slug: 'snowboard-game-party',
    title: 'Snowboard Game Party',
    player: 'https://html5.gamemonetize.co/e60tb5zjmg6wfnkaddqv8bji60h8gx50/',
  },
  {
    slug: 'snowboard-girl',
    title: 'Snowboard Girl',
    player: 'https://html5.gamemonetize.co/m8rawdukwnf27lq4de69iduxipyscbxl/',
  },
];
const snowboardSlugs = ['downhill-snowboard', 'snowboard-game', ...additions.map(game => game.slug), 'waddle-peaks'];
const categoryKeyword = /\bsnowboard\s+games\b/i;
const page = path => load(readFileSync(`dist${path}index.html`, 'utf8'));
const normalize = text => text.replace(/\s+/g, ' ').trim();
const schemas = $ => $('script[type="application/ld+json"]').toArray().flatMap(node => {
  const value = JSON.parse($(node).text());
  return Array.isArray(value) ? value : value['@graph'] ?? [value];
});

for (const game of additions) {
  const path = gamePath(game.slug);
  const canonical = `https://sledgames.com${path}`;

  test(`${game.title} has a dedicated, indexable page focused on the individual game`, () => {
    const $ = page(path);
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    assert.ok(title.startsWith(game.title), 'The game name leads its own search title');
    assert.ok(description.includes(game.title), 'Metadata describes this individual game');
    assert.ok(description.length >= 130 && description.length <= 160);
    for (const [field, text] of Object.entries({ title, description, h1: $('h1').text() })) {
      assert.doesNotMatch(text, categoryKeyword, `${game.slug}: ${field} leaves the plural keyword to the category page`);
    }
    assert.equal($('h1').length, 1);
    assert.equal($('h1.play-heading').text(), game.title);
    assert.equal($('link[rel="canonical"]').length, 1);
    assert.equal($('link[rel="canonical"]').attr('href'), canonical);
    assert.equal($('meta[property="og:url"]').attr('content'), canonical);
    assert.equal($('meta[property="og:title"]').attr('content'), title);
    assert.equal($('meta[property="og:description"]').attr('content'), description);
    $('meta[name="twitter:title"], meta[name="twitter:description"]').each((_, node) => {
      const content = $(node).attr('content');
      assert.equal(content, $(node).attr('name') === 'twitter:title' ? title : description);
      assert.doesNotMatch(content, categoryKeyword);
    });
    assert.equal($('meta[http-equiv="refresh"]').length, 0);
    $('meta[name="robots"], meta[name="googlebot"]').each((_, node) => assert.doesNotMatch($(node).attr('content') ?? '', /noindex/i));
    assert.ok(allPaths.includes(path));

    const structured = schemas($);
    const gameSchemas = structured.filter(schema => schema['@type'] === 'VideoGame');
    assert.equal(gameSchemas.length, 1);
    assert.equal(gameSchemas[0].name, game.title);
    assert.equal(gameSchemas[0].url, canonical);
    const breadcrumbs = structured.filter(schema => schema['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumbs.length, 1);
    assert.deepEqual(breadcrumbs[0].itemListElement.slice(-2).map(item => ({ name: item.name, item: item.item })), [
      { name: 'Snowboard Games', item: 'https://sledgames.com/snowboard-games/' },
      { name: game.title, item: canonical },
    ], 'The game remains a child of the snowboard collection');
  });

  test(`${game.title} uses its official eager player in the existing Downhill detail layout`, () => {
    const $ = page(path);
    const frame = $('.game-stage > iframe');
    assert.equal($('body.play-first.has-snow').length, 1);
    assert.equal($('.game-stage').prev().get(0), $('h1').get(0));
    assert.equal($('iframe').length, 1);
    assert.equal(frame.length, 1);
    assert.equal($('.game-stage.game-stage--fitted').length, 1, 'The player preserves its supplied aspect ratio');
    const ratio = Number(frame.attr('width')) / Number(frame.attr('height'));
    assert.ok(Number.isFinite(ratio) && ratio > 0);
    assert.match($('.game-stage').attr('style'), new RegExp(`--game-ratio:\\s*${String(ratio).replaceAll('.', '\\.')}(?:\\s*;|$)`));
    const src = new URL(frame.attr('src'));
    const expected = new URL(game.player);
    assert.equal(src.origin, expected.origin);
    assert.equal(src.pathname, expected.pathname);
    assert.ok(!src.href.includes('{{PAGE_URL}}'));
    if (game.slug === 'snowboard-king-2024') {
      assert.deepEqual([...src.searchParams], [['gd_sdk_referrer_url', canonical]], 'GameDistribution receives this detail URL exactly once');
    } else {
      assert.equal(src.href, game.player);
    }
    for (const [attribute, value] of Object.entries({
      title: `Play ${game.title}`,
      loading: 'eager',
      allow: 'fullscreen; autoplay; gamepad',
      referrerpolicy: 'strict-origin-when-cross-origin',
    })) assert.equal(frame.attr(attribute), value, attribute);
    assert.ok(frame.is('[allowfullscreen]'));
    assert.equal($('.game-stage [data-ad-slot]').length, 0);
    assert.equal($('.game-stage').prevAll('[data-ad-slot]').length, 0);
    assert.equal($('[data-game-tools] [data-game-reload]').length, 1);
    assert.equal($('[data-game-tools] [data-game-fullscreen]').length, 1);
    assert.equal($('article.game-guide').length, 1);
    assert.equal($('#about-game').length, 1);
    assert.equal($('#how-to-play').length, 1);
    assert.equal($('#game-tips').length, 1);
  });

  test(`${game.title} names its guide headings and exposes instructions without skipping heading levels`, () => {
    const $ = page(path);
    assert.equal($('article.game-guide > .guide-heading h2').text(), `${game.title}: How to Play, Controls and Tips`);
    assert.equal($('#about-game > h3').text(), `What is ${game.title}?`);
    assert.equal($('#how-to-play > h3').text(), `How to Play ${game.title}`);
    assert.equal($('#game-tips > h3').text(), `${game.title} Tips and Strategy`);
    assert.equal($('.guide-controls caption').text(), `${game.title} Controls`);
    assert.equal($('.faq h2').text(), `${game.title} FAQ`);
    const headings = $('main h1, main h2, main h3, main h4, main h5, main h6').toArray();
    assert.equal(headings[0]?.tagName, 'h1');
    let previousLevel = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName.slice(1));
      assert.ok(level <= previousLevel + 1, `${game.slug}: ${$(heading).text()} skips H${previousLevel} to H${level}`);
      previousLevel = level;
    }
    $('main h1, main h2, main h3').each((_, node) => {
      assert.doesNotMatch($(node).text(), categoryKeyword, 'Game content headings do not target the plural category keyword');
    });
    assert.equal($('.category-card h3').length, 0, 'Category navigation labels do not create competing content headings');
    assert.ok(normalize($('#about-game > p:not(.guide-meta)').text()).includes(game.title));
    assert.ok($('.guide-controls tbody tr').length > 0);
    assert.ok($('.guide-steps li').length >= 3);
    assert.ok($('.guide-tips li').length >= 3);
    for (const selector of ['.guide-steps li p', '.guide-tips li p']) {
      $(selector).each((_, node) => assert.ok(normalize($(node).text()), `${game.slug}: guide entries contain useful prose`));
    }
    $('.guide-nav a').each((_, link) => assert.equal($($(link).attr('href')).length, 1, 'Guide anchors resolve to a single section'));
  });

  test(`${game.title} publishes one FAQ schema that exactly matches its visible answers`, () => {
    const $ = page(path);
    const faqs = $('.faq details').toArray().map(node => ({
      q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text().trim(),
      a: $(node).find('p').text().trim(),
    }));
    assert.ok(faqs.length >= 5);
    assert.equal(new Set(faqs.map(faq => faq.q)).size, faqs.length);
    assert.ok(faqs.every(faq => faq.q && faq.a));
    const faqSchemas = schemas($).filter(schema => schema['@type'] === 'FAQPage');
    assert.equal(faqSchemas.length, 1);
    assert.deepEqual(faqSchemas[0].mainEntity, faqs.map(faq => ({
      '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })));
  });
}

test('the snowboard category retains all six games and its keyword ownership', () => {
  const entries = categoryGames('snowboard-games');
  assert.deepEqual(entries.map(game => game.slug).sort(), [...snowboardSlugs].sort());
  const $ = page('/snowboard-games/');
  assert.equal($('h1').text(), 'Snowboard Games');
  assert.match($('title').text(), /^Snowboard Games\b/);
  assert.equal($('link[rel="canonical"]').attr('href'), 'https://sledgames.com/snowboard-games/');
  const cards = $('main .primary-collection .game-card');
  assert.equal(cards.length, snowboardSlugs.length);
  assert.deepEqual(cards.map((_, card) => $(card).attr('href')).get(), entries.map(game => gamePath(game.slug)));
  for (const game of entries) {
    const card = cards.filter(`[href="${gamePath(game.slug)}"]`);
    assert.equal(card.length, 1);
    assert.equal(card.find('h3').clone().find('[aria-hidden]').remove().end().text().trim(), game.title);
    assert.equal(card.find('img').attr('src'), game.thumbnail);
    assert.ok(normalize(card.find('.card-copy > p').text()).includes(game.title));
    assert.equal(card.find('.card-category').text(), 'Snowboarding');
  }
});

test('the six snowboard details link to all five category peers', () => {
  for (const slug of snowboardSlugs) {
    const $ = page(gamePath(slug));
    const related = $('#related-games .game-card');
    const peers = snowboardSlugs.filter(other => other !== slug).map(gamePath);
    assert.equal(related.length, 5);
    assert.deepEqual(new Set(related.map((_, card) => $(card).attr('href')).get()), new Set(peers), `${slug}: all five snowboard alternatives remain visible`);
    assert.equal($('main .category-card[href="/snowboard-games/"]').length, 1, 'Every game links back to its collection');
  }
  for (const game of additions) {
    const path = gamePath(game.slug);
    assert.equal(page('/games/')(`main .game-card[href="${path}"]`).length, 1);
    assert.equal(page('/')(`main .editorial-note a[href="${path}"]`).length, 1);
    const $ = page(path);
    assert.equal($('.quick-links > span[aria-current="page"]').text(), game.title);
    assert.equal($(`footer nav[aria-label="Game links"] a[href="${path}"]`).text(), game.title);
  }
});
