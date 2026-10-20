import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { allPaths } from '../src/lib/catalog.mjs';

const path = '/snowboard-game/';
const title = 'SnowBoard Game - Winter Racing Game Online';
const player = 'https://html5.gamemonetize.co/4jlpcom1sy0z4thlimget2ew3z6ow05d/';
const thumbnail = 'https://img.gamemonetize.com/4jlpcom1sy0z4thlimget2ew3z6ow05d/512x384.jpg';
const questions = [
  'Is SnowBoard Game free?',
  'Do I need to download anything?',
  'What are the controls?',
  'Can I play it on my phone?',
  'Is it unblocked at school or work?',
  "What's the difference between SnowBoard Game and Downhill Snowboard?",
  'Who made SnowBoard Game?',
];
const page = (target = path) => load(readFileSync(`dist${target}index.html`, 'utf8'));
const prose = ($, selector) => $(selector).map((_, node) => $(node).text().trim()).get().join(' ');
const schemas = $ => $('script[type="application/ld+json"]').toArray().flatMap(node => {
  const value = JSON.parse($(node).text());
  return Array.isArray(value) ? value : value['@graph'] ?? [value];
});

test('SnowBoard Game keeps its dedicated player, URL, title, and indexability with complete sharing metadata', () => {
  const $ = page();
  assert.equal($('title').text(), title);
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), 'SnowBoard Game');
  assert.equal($('link[rel="canonical"]').attr('href'), 'https://sledgames.com/snowboard-game/');
  assert.equal($('meta[property="og:url"]').attr('content'), 'https://sledgames.com/snowboard-game/');
  assert.equal($('iframe').length, 1);
  assert.equal($('iframe').attr('src'), player);
  assert.equal($('iframe').attr('title'), 'Play SnowBoard Game');
  assert.equal($('meta[http-equiv="refresh"]').length, 0);
  $('meta[name="robots"], meta[name="googlebot"]').each((_, node) => assert.doesNotMatch($(node).attr('content') ?? '', /noindex/i));
  assert.ok(allPaths.includes(path));
  assert.ok(!allPaths.some(target => /unblocked/i.test(target)), 'Unblocked content stays on the existing game page');
  const description = $('meta[name="description"]').attr('content');
  assert.match(description, /no download/i);
  assert.match(description, /no install/i);
  assert.match(description, /desktop and mobile/i);
  assert.equal($('meta[property="og:description"]').attr('content'), description);
  assert.equal($('meta[property="og:image"]').attr('content'), thumbnail);
  assert.equal($('meta[name="twitter:card"]').attr('content'), 'summary_large_image');
  assert.equal($('meta[name="twitter:image"]').attr('content'), thumbnail);
});

test('SnowBoard Game publishes its introduction, ordered instructions, mobile guidance, and five distinct tips', () => {
  const $ = page();
  assert.equal($('article.game-guide').length, 1);
  assert.equal($('article.game-guide h2').text(), 'SnowBoard Game: how to play and improve');
  const introduction = prose($, '#about-game > p:not(.guide-meta)');
  assert.match(introduction, /Quantum Studio/);
  assert.match(introduction, /February 18, 2026/);
  assert.match(introduction, /browser/i);
  assert.match(introduction, /finish/i);
  assert.match($('.guide-meta').text(), /Developer: Quantum Studio/);
  assert.match($('.guide-meta').text(), /Released: February 18, 2026/);
  assert.deepEqual($('.guide-steps li strong').map((_, node) => $(node).text()).get(), ['Start', 'Move', 'Steer', 'Grab', 'Finish']);
  const playChildren = $('#how-to-play').children().toArray();
  const stepsIndex = playChildren.findIndex(node => $(node).hasClass('guide-steps'));
  const controlsIndex = playChildren.findIndex(node => $(node).hasClass('guide-controls'));
  assert.ok(stepsIndex >= 0 && controlsIndex > stepsIndex, 'Five steps precede the preserved controls table');
  assert.deepEqual($('.guide-controls tbody tr').toArray().map(row => [$(row).find('th').text(), $(row).find('td').text()]), [
    ['Menus / start', 'Mouse click / GO button'],
    ['Move', 'W / A / S / D or arrow keys'],
    ['Grab', 'V'],
  ]);
  const mobile = $('#how-to-play > p').filter((_, node) => /phone|mobile/i.test($(node).text()));
  assert.equal(mobile.length, 1, 'Mobile guidance appears in the how-to-play section');
  assert.match(mobile.text(), /touch/i);
  assert.match(mobile.text(), /instructions/i);
  assert.equal($('.guide-tips li').length, 5);
  $('.guide-tips li').each((_, node) => assert.ok($(node).find('p').text().trim()));
  $('.guide-nav a').each((_, link) => assert.equal($($(link).attr('href')).length, 1, 'Every guide anchor has one target'));
});

test('SnowBoard Game includes its network-access explanation and linked game comparison', () => {
  const $ = page();
  assert.equal($('#snowboard-unblocked').length, 1);
  assert.equal($('#snowboard-unblocked > h2').text(), 'Is SnowBoard Game unblocked?');
  const unblocked = prose($, '#snowboard-unblocked p');
  assert.match(unblocked, /school/i);
  assert.match(unblocked, /work/i);
  assert.match(unblocked, /rules|restrictions|depends/i);
  assert.equal($('#snowboard-comparison').length, 1);
  assert.equal($('#snowboard-comparison > h2').text(), 'SnowBoard Game vs Downhill Snowboard');
  assert.equal($('#snowboard-comparison a[href="/downhill-snowboard/"]').length, 1);
  assert.equal($('#snowboard-comparison a[href="/snowboard-games/"]').length, 1);
});

test('the seven visible SnowBoard Game FAQs match its sole FAQPage and preserve the existing VideoGame schema', () => {
  const $ = page();
  const faqs = $('.faq details').toArray().map(node => ({
    q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text().trim(),
    a: $(node).find('p').text().trim(),
  }));
  assert.deepEqual(faqs.map(entry => entry.q), questions);
  assert.ok(faqs.every(entry => entry.a.length > 0));
  assert.match(faqs[6].a, /Quantum Studio/);
  const structured = schemas($);
  const faqSchemas = structured.filter(schema => schema['@type'] === 'FAQPage');
  assert.equal(faqSchemas.length, 1, 'Only one FAQPage is emitted');
  assert.deepEqual(faqSchemas[0].mainEntity, faqs.map(entry => ({ '@type': 'Question', name: entry.q, acceptedAnswer: { '@type': 'Answer', text: entry.a } })));
  const gameSchemas = structured.filter(schema => schema['@type'] === 'VideoGame');
  assert.equal(gameSchemas.length, 1, 'The existing VideoGame is preserved without duplication');
  assert.equal(gameSchemas[0].name, 'SnowBoard Game');
  assert.equal(gameSchemas[0].url, 'https://sledgames.com/snowboard-game/');
  assert.deepEqual(gameSchemas[0].author, { '@type': 'Organization', name: 'Quantum Studio' });
  assert.equal(gameSchemas[0].datePublished, '2026-02-18');
  assert.equal(gameSchemas[0].applicationCategory, 'Game');
  assert.equal(gameSchemas[0].operatingSystem, 'Web Browser');
  assert.equal(gameSchemas[0].offers.price, 0);
  assert.ok(!gameSchemas[0].aggregateRating);
});

test('SnowBoard Game preserves its internal destinations and cards while the current navigation item is a span', () => {
  const $ = page();
  // These are the pre-change href counts; the new prose links may increase them.
  const existingLinks = {
    '/': 4, '/snowboard-games/': 2, '/ski-games/': 2, '/christmas-games/': 2, '/games/': 3,
    '/sled-rider/': 2, '/downhill-snowboard/': 3, '/snowboard-game/': 2, '/ski-king/': 2,
    '/ski-rush/': 2, '/santa-collecting-gifts/': 2, '/crazy-christmas-fun/': 2,
    '/snow-rider-2/': 2, '/snowball-io/': 2, '/moto-x3m-winter/': 2,
    '/about/': 1, '/contact/': 1, '/privacy-policy/': 1, '/terms-of-use/': 1, '/copyright/': 1,
  };
  assert.equal(Object.values(existingLinks).reduce((sum, count) => sum + count, 0), 39);
  for (const [href, minimum] of Object.entries(existingLinks)) {
    const expected = href === path ? minimum - 1 : minimum;
    assert.ok($(`a[href="${href}"]`).length >= expected, `${href}: preserve ${expected} links after replacing the current navigation item`);
  }
  assert.equal($('.quick-links span[aria-current="page"]').text(), 'SnowBoard Game');
  for (const source of ['/snowboard-games/', '/downhill-snowboard/']) {
    const incoming = page(source);
    const card = incoming(`main .game-card[href="${path}"]`);
    assert.equal(card.length, 1, `${source}: one SnowBoard Game card`);
    assert.equal(card.find('h3').clone().find('[aria-hidden]').remove().end().text().trim(), 'SnowBoard Game');
    assert.match(card.find('p').text(), /SnowBoard Game/, `${source}: descriptive card copy includes the full game name`);
  }
  assert.equal(page('/snowboard-games/')('h1').text(), 'Snowboard Games', 'The plural keyword keeps its existing category page');
});
