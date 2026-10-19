import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { games, categoryGames, externalPlayLabel, validateGames, canonical, gamePath } from '../src/lib/catalog.mjs';

const game = games.find(entry => entry.slug === 'waddle-peaks');
const destination = 'https://play.benerits.com/en/g/waddle-peaks';
const page = path => load(readFileSync(`dist${path}index.html`, 'utf8'));
const schemas = $ => $('script[type="application/ld+json"]').toArray().flatMap(node => {
  const value = JSON.parse($(node).text());
  return Array.isArray(value) ? value : value['@graph'] ?? [value];
});

test('Waddle Peaks accepts its exact official external destination without admitting other URLs or an iframe', () => {
  const candidate = { ...structuredClone(game), similar: [] };
  assert.equal(candidate.externalPlayUrl, destination);
  assert.deepEqual(candidate.category, ['ski-games']);
  assert.equal(externalPlayLabel(candidate), 'Benerits');
  assert.doesNotThrow(() => validateGames([candidate]));
  for (const url of [
    'http://play.benerits.com/en/g/waddle-peaks',
    'https://play.benerits.com.attacker.test/en/g/waddle-peaks',
    'https://attacker.test/en/g/waddle-peaks',
    'https://play.benerits.com/en/g/another-game',
    'https://user:pass@play.benerits.com/en/g/waddle-peaks',
    'javascript:alert(1)',
  ]) assert.throws(() => validateGames([{ ...candidate, externalPlayUrl: url }]), /external game destination/);
  assert.throws(() => validateGames([{ ...candidate, slug: 'another-game' }]), /external game destination/);
  assert.throws(() => validateGames([{ ...candidate, embed: { ...candidate.embed, provider: 'gamepix', iframeSrc: 'https://play.gamepix.com/gnome-bobsled/embed' } }]), /external game destination/);
});

test('Waddle Peaks has a complete game-specific guide and an explicit official-site launch', () => {
  const $ = page(gamePath(game.slug));
  assert.equal($('h1').length, 1);
  assert.equal($('h1.play-heading').text(), game.title);
  assert.equal($('link[rel="canonical"]').attr('href'), canonical(gamePath(game.slug)));
  assert.ok($('title').text().startsWith(game.title));
  assert.equal($('meta[name="description"]').attr('content'), game.description);
  assert.ok(game.description.length >= 130 && game.description.length <= 160);
  for (const text of [$('title').text(), game.description, ...$('main h1, main h2, main h3').map((_, node) => $(node).text()).get()]) {
    assert.doesNotMatch(text, /\bski\s+games\b/i, 'The category owns its plural search phrase');
  }
  assert.equal($('iframe, [data-game-tools], [data-game-reload], [data-game-fullscreen]').length, 0);
  const launch = $('.game-stage .game-external a');
  assert.equal(launch.length, 1);
  assert.equal(launch.attr('href'), destination);
  assert.equal(launch.text().replace('↗', '').trim(), 'Play on Benerits');
  assert.equal(launch.attr('target'), '_blank');
  assert.match(launch.attr('rel'), /\bnoopener\b/);
  assert.match(launch.attr('rel'), /\bnoreferrer\b/);
  assert.equal($('.game-stage img').attr('src'), game.thumbnail);
  assert.equal($('.game-stage img').attr('loading'), 'eager');
  assert.match($('.game-stage p').text(), /new tab/i);
  assert.equal($('.game-stage [data-ad-slot]').length, 0);
  assert.equal($('article.game-guide > .guide-heading h2').text(), `${game.title}: How to Play, Controls and Tips`);
  assert.equal($('#how-to-play > h3').text(), `How to Play ${game.title}`);
  assert.equal($('.guide-controls tbody tr').length, game.controls.length);
  assert.equal($('.guide-steps li').length, game.howToPlay.length);
  assert.equal($('.guide-tips li').length, game.tips.length);
  for (const section of ['intro', 'howToPlay', 'tips', 'controls', 'faqs']) assert.equal(game.sources[section], destination);
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
    { name: game.title, item: canonical(gamePath(game.slug)) },
  ]);
});

test('the ski collection keeps its four-game cards, metadata, prose and launch FAQ consistent', () => {
  const entries = categoryGames('ski-games');
  const $ = page('/ski-games/');
  assert.deepEqual(entries.map(entry => entry.slug), ['ski-king', 'ski-rush', 'waddle-peaks', 'snow-riders']);
  assert.equal($('main .primary-collection .game-card').length, entries.length);
  const description = $('meta[name="description"]').attr('content');
  assert.ok(description.length >= 130 && description.length <= 160);
  const prose = $('main > .prose').text();
  const launchFaq = $('.faq details').first().find('p').text();
  const controlsFaq = $('.faq details').filter((_, node) => /controls/i.test($(node).find('summary').text())).first().find('p').text();
  for (const entry of entries) {
    assert.ok(description.includes(entry.title), `${entry.title}: appears in the collection metadata`);
    assert.ok(prose.includes(entry.title), `${entry.title}: appears in the collection overview`);
    assert.ok(launchFaq.includes(entry.title), `${entry.title}: appears in the launch FAQ`);
    assert.ok(controlsFaq.includes(entry.title), `${entry.title}: appears in the controls FAQ`);
  }
  assert.match($('.faq').text(), /Waddle Peaks[\s\S]*(?:Space|carve|jump)/i);
  for (const category of ['sledding-games', 'snowboard-games', 'christmas-games']) {
    assert.ok(!categoryGames(category).some(entry => entry.slug === game.slug));
  }
  const snowboard = page('/snowboard-games/');
  assert.equal(snowboard('main .primary-collection .game-card').length, 5);
  assert.equal(snowboard('main .primary-collection .game-card[href="/waddle-peaks/"]').length, 0);
  for (const text of [snowboard('meta[name="description"]').attr('content'), snowboard('main > .prose').text(), snowboard('.faq').text()]) {
    assert.doesNotMatch(text, /Waddle Peaks/i, 'The snowboard category has no leftover Waddle Peaks copy');
  }
});
