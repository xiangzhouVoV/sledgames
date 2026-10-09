import test from 'node:test';
import assert from 'node:assert/strict';
import { games, validateGames, embedUrl, canonical, serializeSchema } from '../src/lib/catalog.mjs';

const fixture = () => structuredClone(games[0]);

test('GameDistribution embeds carry the current page URL exactly once', () => {
  const game = fixture();
  game.embed = { ...game.embed, provider: 'gamedistribution', iframeSrc: 'https://html5.gamedistribution.com/test-id/?gd_sdk_referrer_url={{PAGE_URL}}&other=value' };
  for (const page of [canonical('/'), canonical('/sled-rider')]) {
    const url = new URL(embedUrl(game, page));
    assert.equal(url.searchParams.get('gd_sdk_referrer_url'), page);
    assert.equal(url.searchParams.getAll('gd_sdk_referrer_url').length, 1);
    assert.equal(url.searchParams.get('other'), 'value');
  }
  game.embed.iframeSrc = 'https://html5.gamedistribution.com/test-id/';
  assert.equal(new URL(embedUrl(game, canonical('/sled-rider'))).searchParams.get('gd_sdk_referrer_url'), canonical('/sled-rider'));
});

test('only approved publisher hosts can be embedded', () => {
  const game = fixture();
  game.embed.provider = 'gamedistribution';
  for (const src of ['http://html5.gamedistribution.com/id', 'https://html5.gamedistribution.com.attacker.test/id', 'https://sledrider.io/', 'https://user:pass@html5.gamedistribution.com/id', 'javascript:alert(1)']) {
    game.embed.iframeSrc = src;
    assert.throws(() => embedUrl(game, canonical('/sled-rider')));
  }
  game.embed.provider = 'gamemonetize';
  game.embed.iframeSrc = 'https://html5.gamemonetize.com/test-id/';
  assert.equal(embedUrl(game, canonical('/sled-rider')), game.embed.iframeSrc);
  game.embed.provider = 'azgames';
  game.embed.iframeSrc = 'https://gamea.azgame.io/sled-rider/';
  assert.equal(embedUrl(game, canonical('/sled-rider')), game.embed.iframeSrc);
  for (const src of ['https://gamea.azgame.io/another-game/', 'https://gamea.azgame.io.attacker.test/sled-rider/']) {
    game.embed.iframeSrc = src;
    assert.throws(() => embedUrl(game, canonical('/sled-rider')));
  }
});

test('unverified game details fail the build instead of being published', () => {
  for (const [field, value] of Object.entries({ intro: 'An unsupported claim', tips: ['Invented tip'], howToPlay: ['Invented controls'], controls: [{ action: 'Jump', input: 'Invented key' }], items: [{ name: 'A sled', price: '100' }], rating: { value: 5, count: 100 }, playCount: 100 })) {
    const game = fixture();
    game[field] = value;
    game.sources[field] = '';
    assert.throws(() => validateGames([game]), /needs a source/);
  }
});

test('reserved routes, duplicates, and broken related links are rejected', () => {
  const game = fixture();
  for (const slug of ['about', 'games', 'snowboard-games', 'Bad Slug']) {
    assert.throws(() => validateGames([{ ...game, slug }]));
  }
  assert.throws(() => validateGames([game, game]), /duplicate/);
  assert.throws(() => validateGames([{ ...game, similar: ['missing-game'] }]), /existing/);
});

test('JSON-LD cannot break out of its script element', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  const serialized = serializeSchema(value);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), value);
});
