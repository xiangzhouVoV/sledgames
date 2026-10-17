import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { games, relatedGames, gameCategory, gamePath, RELATED_GAME_LIMIT } from '../src/lib/catalog.mjs';

const page = slug => load(readFileSync(`dist/${slug}/index.html`, 'utf8'));
const fixture = (slug, category = 'ski-games') => ({ ...structuredClone(games[0]), slug, category: [category], similar: [] });

test('recommendations rank category peers before editorial winter selections and preserve input order', () => {
  const source = fixture('source');
  source.similar = ['other-preferred', 'winter-preferred', 'peer-preferred'];
  const entries = [
    source,
    fixture('other-preferred', 'snowboard-games'),
    fixture('winter-first', 'sledding-games'),
    fixture('peer-first'),
    fixture('winter-preferred', 'winter-games'),
    fixture('peer-preferred'),
    fixture('peer-second'),
    fixture('other-last', 'christmas-games'),
  ];
  const original = structuredClone(entries);
  assert.deepEqual(relatedGames(source, entries).map(game => game.slug), [
    'peer-preferred', 'peer-first', 'peer-second', 'winter-preferred', 'winter-first',
  ]);
  assert.deepEqual(entries, original, 'Recommendation sorting does not mutate the catalog or editorial lists');
});

test('small catalogs return available distinct alternatives and use the wider collection after winter options', () => {
  const source = fixture('source');
  source.similar = ['missing', 'other-preferred'];
  const peer = fixture('peer');
  const entries = [
    source, peer, { ...peer },
    fixture('other-first', 'snowboard-games'),
    fixture('winter', 'winter-games'),
    fixture('other-preferred', 'christmas-games'),
  ];
  assert.deepEqual(relatedGames(source, entries).map(game => game.slug), [
    'peer', 'winter', 'other-preferred', 'other-first',
  ]);
  assert.deepEqual(relatedGames(source, [source]), []);
  assert.deepEqual(relatedGames(source, []), []);
});

test('every game detail renders five unique sibling cards with category peers first and winter games filling gaps', () => {
  assert.equal(RELATED_GAME_LIMIT, 5);
  for (const game of games) {
    const $ = page(game.slug);
    const section = $('main section.related-games#related-games');
    assert.equal(section.length, 1, `${game.slug}: one related-games section, including Sled Rider`);
    assert.equal(section.attr('aria-labelledby'), 'related-games-heading');
    assert.equal(section.find('h2#related-games-heading').text(), 'Explore More Winter Games');
    const cards = section.find('.game-grid > a.game-card');
    assert.equal(cards.length, 5, `${game.slug}: exactly five recommendations`);
    const targets = cards.map((_, card) => $(card).attr('href')).get();
    assert.equal(new Set(targets).size, targets.length, `${game.slug}: no duplicate card destinations`);
    assert.ok(!targets.includes(gamePath(game.slug)), `${game.slug}: no card links to itself`);
    assert.deepEqual(targets, relatedGames(game).map(other => gamePath(other.slug)), `${game.slug}: static cards follow the shared recommendation policy`);

    const peers = games.filter(other => other.slug !== game.slug && other.category.some(category => game.category.includes(category)));
    assert.deepEqual(new Set(targets.slice(0, peers.length)), new Set(peers.map(other => gamePath(other.slug))), `${game.slug}: all current category peers come first`);
    const fillers = targets.slice(peers.length).map(path => games.find(other => gamePath(other.slug) === path));
    const winterPool = games.filter(other => other.slug !== game.slug && !peers.includes(other) && other.category.some(category => ['sledding-games', 'winter-games'].includes(category)));
    const expectedWinterSlots = Math.min(winterPool.length, cards.length - peers.length);
    assert.ok(fillers.slice(0, expectedWinterSlots).every(other => winterPool.includes(other)), `${game.slug}: winter games fill remaining slots before other categories`);

    cards.each((_, node) => {
      const card = $(node);
      const other = games.find(other => gamePath(other.slug) === card.attr('href'));
      assert.equal(card.find('h3').length, 1, `${game.slug}: each sibling card has an H3 beneath the section H2`);
      assert.equal(card.find('.card-badge').text(), `Play ${other.title}`);
      assert.equal(card.find('.card-category').text(), gameCategory(other).label);
      const description = card.find('.card-copy > p').text().trim();
      assert.ok(description, `${game.slug}: ${other.slug} has a description`);
      assert.notEqual(description, other.description, `${game.slug}: ${other.slug} does not fall back to metadata copy`);
      assert.doesNotMatch(description, /^Play .+? online for free\b/i);
    });
  }
});

test('Sled Rider and Snow Rider 2 recommend each other first with the Sledding label', () => {
  for (const [source, target] of [['sled-rider', 'snow-rider-2'], ['snow-rider-2', 'sled-rider']]) {
    const $ = page(source);
    const firstCard = $('#related-games .game-card').first();
    assert.equal(firstCard.attr('href'), gamePath(target));
    assert.equal(firstCard.find('.card-category').text(), 'Sledding');
  }
});
