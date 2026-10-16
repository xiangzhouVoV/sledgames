import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, symlinkSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { load } from 'cheerio';
import { games, canonical } from '../src/lib/catalog.mjs';

test('configured official embeds render distinct dedicated game referrers while the homepage has no player', () => {
  const root = mkdtempSync(join(tmpdir(), 'sledgames-fixture-'));
  try {
    for (const name of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) cpSync(name, join(root, name), { recursive: true });
    symlinkSync(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir');
    mkdirSync(join(root, 'data'));
    const game = structuredClone(games[0]);
    game.embed.provider = 'gamedistribution';
    game.embed.iframeSrc = 'https://html5.gamedistribution.com/test-only-id/?gd_sdk_referrer_url={{PAGE_URL}}';
    writeFileSync(join(root, 'data/games.json'), JSON.stringify([game, { ...structuredClone(game), slug: 'fixture-game', title: 'Fixture Game' }]));
    execFileSync(process.execPath, [join(process.cwd(), 'node_modules/.bin/astro'), 'build'], { cwd: root, stdio: 'pipe', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
    for (const path of ['/sled-rider/', '/fixture-game/']) {
      const $ = load(readFileSync(join(root, 'dist', path, 'index.html'), 'utf8'));
      assert.equal($('iframe').length, 1);
      assert.equal(new URL($('iframe').attr('src')).searchParams.get('gd_sdk_referrer_url'), canonical(path));
      const stage = $('iframe').parent();
      assert.equal(stage.prevAll('[data-ad-slot]').length, 0);
      assert.ok(stage.nextAll('[data-ad-slot="below"]').length);
      assert.equal(stage.find('[data-ad-slot]').length, 0);
      assert.equal($('iframe').attr('loading'), 'eager');
    }
    const home = load(readFileSync(join(root, 'dist/index.html'), 'utf8'));
    assert.equal(home('iframe, .game-stage, .game-guide').length, 0);
    assert.deepEqual(home('main .featured-games .game-card').map((_, card) => home(card).attr('href')).get(), ['/sled-rider/', '/fixture-game/']);
    assert.deepEqual(home('main .home-collection .game-card--compact').map((_, card) => home(card).attr('href')).get(), ['/sled-rider/', '/fixture-game/']);
    assert.equal(home('main .game-card').length, 4, 'Both home collections use the fixture catalog rather than a fixed game count');
    assert.match(home('.home-collection .section-heading p').text(), /All 2 games/);
    const $ = load(readFileSync(join(root, 'dist/games/index.html'), 'utf8'));
    const schemas = $('script[type="application/ld+json"]').map((_, node) => JSON.parse($(node).text())).get();
    const list = schemas.find(schema => schema['@type'] === 'ItemList');
    assert.deepEqual(list.itemListElement.map(item => item.url), [canonical('/sled-rider/'), canonical('/fixture-game/')]);
    assert.equal($('main .game-card').length, 2);
    assert.equal($('.quick-links a[href="/fixture-game/"]').length, 1);
    assert.equal($('footer nav[aria-label="Game links"] a[href="/fixture-game/"]').length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
