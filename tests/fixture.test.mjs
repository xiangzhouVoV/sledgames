import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, symlinkSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { load } from 'cheerio';
import { games, canonical } from '../src/lib/catalog.mjs';

test('configured official embeds render different home/game referrers with sibling ads', () => {
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
    for (const path of ['/', '/fixture-game']) {
      const $ = load(readFileSync(join(root, 'dist', path === '/' ? 'index.html' : 'fixture-game/index.html'), 'utf8'));
      assert.equal($('iframe').length, 1);
      assert.equal(new URL($('iframe').attr('src')).searchParams.get('gd_sdk_referrer_url'), canonical(path));
      const stage = $('iframe').parent();
      assert.equal(stage.prevAll('[data-ad-slot]').length, 0);
      assert.ok(stage.nextAll('[data-ad-slot="below"]').length);
      assert.equal(stage.find('[data-ad-slot]').length, 0);
      assert.equal($('iframe').attr('loading'), 'eager');
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
