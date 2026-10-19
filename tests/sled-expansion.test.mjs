import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { games, categoryGames, embedUrl, validateGames, canonical, gamePath } from '../src/lib/catalog.mjs';

const additions = ['gnome-bobsled', 'sled-line', 'sleigh-o-balance'].map(slug => games.find(game => game.slug === slug));
const page = path => load(readFileSync(`dist${path}index.html`, 'utf8'));

test('GamePix allows only the verified HTTPS game players and preserves supplied publisher parameters', () => {
  const game = structuredClone(additions[0]);
  for (const slug of ['gnome-bobsled', 'sled-line']) {
    game.embed.iframeSrc = `https://play.gamepix.com/${slug}/embed`;
    assert.equal(embedUrl(game, canonical(gamePath(game.slug))), game.embed.iframeSrc);
  }
  game.embed.iframeSrc = 'https://play.gamepix.com/gnome-bobsled/embed?sid=publisher-fixture';
  assert.equal(new URL(embedUrl(game, canonical('/gnome-bobsled/'))).searchParams.get('sid'), 'publisher-fixture');
  for (const src of [
    'http://play.gamepix.com/gnome-bobsled/embed',
    'https://play.gamepix.com.attacker.test/gnome-bobsled/embed',
    'https://user:pass@play.gamepix.com/gnome-bobsled/embed',
    'https://play.gamepix.com/unverified-game/embed',
    'https://play.gamepix.com/gnome-bobsled/',
  ]) {
    game.embed.iframeSrc = src;
    assert.throws(() => embedUrl(game, canonical('/gnome-bobsled/')));
  }
});

test('external play accepts only the verified creator page and never masks it with an iframe', () => {
  const game = structuredClone(additions[2]);
  game.similar = [];
  assert.doesNotThrow(() => validateGames([game]));
  for (const url of ['http://xxchester.itch.io/sleigh-o-balance', 'https://xxchester.itch.io.attacker.test/sleigh-o-balance', 'https://xxchester.itch.io/another-game', 'javascript:alert(1)']) {
    assert.throws(() => validateGames([{ ...game, externalPlayUrl: url }]), /external game destination/);
  }
  assert.throws(() => validateGames([{ ...game, slug: 'another-game' }]), /external game destination/);
  assert.throws(() => validateGames([{ ...game, embed: { ...game.embed, provider: 'gamepix', iframeSrc: 'https://play.gamepix.com/gnome-bobsled/embed' } }]), /external game destination/);
});

for (const game of additions) {
  test(`${game.title} keeps its own SEO, guide, FAQ, and verified play destination`, () => {
    const $ = page(gamePath(game.slug));
    assert.equal($('h1').text(), game.title);
    assert.ok($('title').text().startsWith(game.title));
    assert.equal($('meta[name="description"]').attr('content'), game.description);
    assert.equal($('meta[property="og:description"]').attr('content'), game.description);
    assert.equal($('link[rel="canonical"]').attr('href'), canonical(gamePath(game.slug)));
    for (const text of [$('title').text(), game.description, ...$('main h1, main h2, main h3').map((_, node) => $(node).text()).get()]) {
      assert.doesNotMatch(text, /\bsled games\b/i, 'The collection keyword belongs to the homepage');
    }
    assert.equal($('#how-to-play > h3').text(), `How to Play ${game.title}`);
    assert.equal($('#game-tips > h3').text(), `${game.title} Tips and Strategy`);
    assert.ok($('.guide-controls tbody tr').length > 0);
    assert.equal($('.guide-steps li').length, game.howToPlay.length);
    assert.equal($('.guide-tips li').length, game.tips.length);
    assert.equal($('.faq h2').text(), `${game.title} FAQ`);
    const visible = $('.faq details').map((_, node) => ({
      q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text(),
      a: $(node).find('p').text(),
    })).get();
    const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
    assert.deepEqual(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity,
      visible.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })));
    assert.equal(schemas.find(schema => schema['@type'] === 'VideoGame').name, game.title);
    assert.equal($('main .category-card[href="/"]').length, 1);
    if (game.externalPlayUrl) {
      assert.equal($('iframe, [data-game-tools]').length, 0);
      const launch = $('.game-external a');
      assert.equal(launch.attr('href'), game.externalPlayUrl);
      assert.equal(launch.text().replace('↗', '').trim(), 'Play on itch.io');
      assert.equal(launch.attr('target'), '_blank');
      assert.match(launch.attr('rel'), /noopener/);
      assert.equal($('.game-stage [data-ad-slot]').length, 0);
    } else {
      assert.equal($('.game-stage iframe').attr('src'), game.embed.iframeSrc);
      assert.equal($('.game-stage iframe').attr('loading'), 'eager');
      assert.equal($('.game-stage--fitted').length, 1);
      assert.equal($('[data-game-reload]').length, 1);
    }
  });
}

test('the sledding collection, prose, metadata and FAQ name the same five games', () => {
  const entries = categoryGames('sledding-games');
  assert.equal(entries.length, 5);
  const $ = page('/');
  assert.deepEqual($('.featured-games .game-card').map((_, node) => $(node).attr('href')).get(), entries.map(game => gamePath(game.slug)));
  const description = $('meta[name="description"]').attr('content');
  for (const game of entries) {
    assert.ok(description.includes(game.title));
    assert.ok($('.hub-guide').text().includes(game.title));
    assert.ok($('.faq details').first().find('p').text().includes(game.title));
    assert.equal(page('/games/')(`main .game-card[href="${gamePath(game.slug)}"]`).length, 1);
  }
  assert.equal($('iframe').length, 0);
  assert.doesNotMatch($('.hub-guide').text(), /Both sled games in this collection are endless|Sled Rider and Snow Rider 2 are the current choices/);
});
