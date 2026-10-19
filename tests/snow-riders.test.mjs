import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { games, categoryGames, externalPlayLabel, validateGames, canonical, gamePath } from '../src/lib/catalog.mjs';

const game = games.find(entry => entry.slug === 'snow-riders');
const destination = 'https://poki.com/en/g/snow-riders';
const page = path => load(readFileSync(`dist${path}index.html`, 'utf8'));
const schemas = $ => $('script[type="application/ld+json"]').toArray().flatMap(node => {
  const value = JSON.parse($(node).text());
  return Array.isArray(value) ? value : value['@graph'] ?? [value];
});

test('Snow Riders accepts only its verified Poki destination with no embedded-player substitute', () => {
  const candidate = { ...structuredClone(game), similar: [] };
  assert.equal(candidate.title, 'Snow Riders');
  assert.equal(candidate.developer, 'Sleepless Games');
  assert.deepEqual(candidate.category, ['ski-games']);
  assert.equal(candidate.externalPlayUrl, destination);
  assert.equal(externalPlayLabel(candidate), 'Poki');
  assert.doesNotThrow(() => validateGames([candidate]));
  for (const url of [
    'http://poki.com/en/g/snow-riders',
    'https://poki.com.attacker.test/en/g/snow-riders',
    'https://poki.com/en/g/snow-rider-2',
    'https://user:pass@poki.com/en/g/snow-riders',
    'javascript:alert(1)',
  ]) assert.throws(() => validateGames([{ ...candidate, externalPlayUrl: url }]), /external game destination/);
  assert.throws(() => validateGames([{ ...candidate, slug: 'another-game' }]), /external game destination/);
  assert.throws(() => validateGames([{ ...candidate, embed: { ...candidate.embed, provider: 'gamepix', iframeSrc: 'https://play.gamepix.com/gnome-bobsled/embed' } }]), /external game destination/);
});

test('Snow Riders keeps its own title, guide, FAQ schema and clearly labelled Poki launch', () => {
  const $ = page(gamePath(game.slug));
  assert.equal($('h1').length, 1);
  assert.equal($('h1.play-heading').text(), game.title);
  assert.ok($('title').text().startsWith(game.title));
  assert.equal($('meta[name="description"]').attr('content'), game.description);
  assert.equal($('link[rel="canonical"]').attr('href'), canonical('/snow-riders/'));
  assert.ok(game.description.length >= 130 && game.description.length <= 160);
  for (const text of [$('title').text(), game.description, ...$('main h1, main h2, main h3').map((_, node) => $(node).text()).get()]) {
    assert.doesNotMatch(text, /\bski\s+games\b/i, 'The category owns its plural search phrase');
  }
  assert.equal($('iframe, [data-game-tools], [data-game-reload], [data-game-fullscreen]').length, 0);
  const launch = $('.game-stage .game-external a');
  assert.equal(launch.length, 1);
  assert.equal(launch.attr('href'), destination);
  assert.equal(launch.text().replace('↗', '').trim(), 'Play on Poki');
  assert.equal(launch.attr('target'), '_blank');
  assert.match(launch.attr('rel'), /\bnoopener\b/);
  assert.match(launch.attr('rel'), /\bnoreferrer\b/);
  assert.match($('.game-stage p').text(), /new tab/i);
  assert.equal($('.game-stage [data-ad-slot]').length, 0);
  assert.equal($('article.game-guide > .guide-heading h2').text(), `${game.title}: How to Play, Controls and Tips`);
  assert.equal($('#how-to-play > h3').text(), `How to Play ${game.title}`);
  assert.equal($('.guide-controls tbody tr').length, game.controls.length);
  assert.equal($('.guide-steps li').length, game.howToPlay.length);
  assert.equal($('.guide-tips li').length, game.tips.length);
  for (const field of ['intro', 'howToPlay', 'controls', 'faqs', 'externalPlayUrl']) assert.equal(game.sources[field], destination);
  const visibleFaqs = $('.faq details').toArray().map(node => ({
    q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text().trim(),
    a: $(node).find('p').text().trim(),
  }));
  const structured = schemas($);
  assert.equal($('.faq h2').text(), `${game.title} FAQ`);
  assert.deepEqual(visibleFaqs, game.faqs);
  assert.deepEqual(structured.find(schema => schema['@type'] === 'FAQPage').mainEntity, visibleFaqs.map(faq => ({
    '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })));
  assert.equal(structured.find(schema => schema['@type'] === 'VideoGame').name, game.title);
  assert.deepEqual(structured.find(schema => schema['@type'] === 'BreadcrumbList').itemListElement.slice(-2).map(entry => ({ name: entry.name, item: entry.item })), [
    { name: 'Ski Games', item: canonical('/ski-games/') },
    { name: game.title, item: canonical('/snow-riders/') },
  ]);
});

test('Snow Riders remains distinct from Snow Rider 2 and recommends the other ski games first', () => {
  const olderGame = games.find(entry => entry.slug === 'snow-rider-2');
  assert.ok(olderGame, 'The existing sled game remains in the catalog');
  assert.notEqual(gamePath(game.slug), gamePath(olderGame.slug));
  assert.notEqual(game.externalPlayUrl, olderGame.embed.iframeSrc);
  assert.notEqual(game.developer, olderGame.developer);
  assert.equal(page(gamePath(olderGame.slug))('h1').text(), olderGame.title);
  for (const category of ['sledding-games', 'snowboard-games', 'christmas-games']) {
    assert.ok(!categoryGames(category).some(entry => entry.slug === game.slug));
  }
  const $ = page(gamePath(game.slug));
  const related = $('#related-games .game-card');
  assert.equal(related.length, 5);
  assert.deepEqual(new Set(related.slice(0, 3).map((_, card) => $(card).attr('href')).get()), new Set(['/ski-king/', '/ski-rush/', '/waddle-peaks/']));
  related.slice(3).each((_, card) => {
    const target = games.find(entry => gamePath(entry.slug) === $(card).attr('href'));
    assert.ok(target.category.some(category => ['sledding-games', 'winter-games'].includes(category)), 'Winter games fill both remaining recommendation slots');
  });
  const collection = page('/ski-games/');
  assert.equal(collection('main .primary-collection .game-card[href="/snow-riders/"]').length, 1);
  assert.equal(collection('main .primary-collection .game-card[href="/snow-rider-2/"]').length, 0);
  assert.equal(page('/snowboard-games/')('main .primary-collection .game-card[href="/snow-riders/"]').length, 0);
});
