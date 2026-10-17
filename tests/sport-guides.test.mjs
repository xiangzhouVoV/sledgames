import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { games } from '../src/lib/catalog.mjs';

const targets = [
  {
    slug: 'ski-king',
    title: 'Ski King',
    other: 'ski-rush',
    otherTitle: 'Ski Rush',
    collection: '/ski-games/',
    player: 'https://html5.gamemonetize.co/220zq0t2ac34j1ghs7gsmtvb8pawcepf/',
    controls: [['Steer', 'Left / Right arrow keys'], ['Menus / upgrades', 'Mouse or touch']],
    identity: [/\bflags?\b/i, /\bcorrect side\b|\bmarked side\b/i, /\bfinish\b/i, /\btime\b|\bfaster\b/i, /\breset\w*\b/i, /\bupgrade\w*\b/i],
  },
  {
    slug: 'ski-rush',
    title: 'Ski Rush',
    other: 'ski-king',
    otherTitle: 'Ski King',
    collection: '/ski-games/',
    player: 'https://html5.gamemonetize.co/qhm0nbxkucx74gkbrix22wywohn2lwrz/',
    controls: [['Steer / interact', 'Mouse or touch']],
    identity: [/\bsurviv\w*\b|\bas long as\b/i, /\bflags?\b/i, /\bscore\b|\bpoints\b/i, /\bobstacles?\b/i, /\bcrash\w*\b|\bhit\b|\bcollid\w*\b|\bcollision\b/i],
  },
  {
    slug: 'downhill-snowboard',
    title: 'Downhill Snowboard',
    other: 'snowboard-game',
    otherTitle: 'SnowBoard Game',
    collection: '/snowboard-games/',
    player: 'https://html5.gamemonetize.co/xxlz1gjpdxfhl98zmshxkqg3a90gccvz/',
    controls: [['Steer left / right', 'A / D or arrow keys'], ['Menus / interaction', 'Mouse or touch']],
    identity: [/\b2D\b/i, /\bscore\b|\bpoints\b/i, /\bcoins?\b/i, /\bunlock\w*\b/i, /\bcharacters?\b/i, /\bboards?\b|\bsnowboards?\b/i],
  },
];

const normalize = text => text.replace(/\s+/g, ' ').trim();
const page = slug => load(readFileSync(`dist/${slug}/index.html`, 'utf8'));
const schemas = $ => $('script[type="application/ld+json"]').toArray().flatMap(node => {
  const value = JSON.parse($(node).text());
  return Array.isArray(value) ? value : value['@graph'] ?? [value];
});
const visibleFaqs = $ => $('.faq details').toArray().map(node => ({
  q: $(node).find('summary').clone().find('[aria-hidden]').remove().end().text().trim(),
  a: $(node).find('p').text().trim(),
}));

test('the three sport guides publish a distinct 1000–1200 character core rather than counting shared UI or recommendations', () => {
  const openings = new Set();
  for (const target of targets) {
    const game = games.find(game => game.slug === target.slug);
    const $ = page(target.slug);
    const core = normalize([game.intro, ...game.howToPlay, ...game.tips].join(' '));
    assert.ok(core.length >= 1000 && core.length <= 1200, `${target.slug}: intro, instructions and tips contain ${core.length} characters`);
    const firstSentence = game.intro.split(/[.!?](?:\s+|$)/, 1)[0];
    assert.ok(!openings.has(firstSentence), `${target.slug}: the introduction has its own opening`);
    openings.add(firstSentence);
    assert.doesNotMatch(game.intro, /^Play .+? online for free\b/i);
    assert.deepEqual($('#about-game > p:not(.guide-meta)').map((_, node) => $(node).text()).get(), game.intro.split(/\n\s*\n/).filter(Boolean), `${target.slug}: the expanded introduction is visible`);
    assert.equal($('.guide-steps li').length, game.howToPlay.length);
    assert.equal($('.guide-tips li').length, game.tips.length);
    assert.ok($('.guide-steps li').length >= 4 && $('.guide-tips li').length >= 3, `${target.slug}: instructions and strategy remain separate useful sections`);
    const guideText = normalize($('article.game-guide').text());
    for (const detail of target.identity) assert.match(guideText, detail, `${target.slug}: preserve its objective, failure conditions, and progression`);
  }
});

for (const target of targets) {
  test(`${target.title} preserves its own controls, dedicated eager player, and canonical URL`, () => {
    const $ = page(target.slug);
    assert.equal($('h1').length, 1);
    assert.equal($('h1').text(), target.title);
    const url = `https://sledgames.com/${target.slug}/`;
    assert.equal($('link[rel="canonical"]').attr('href'), url);
    assert.equal($('meta[property="og:url"]').attr('content'), url);
    assert.equal($('iframe').length, 1);
    assert.equal($('iframe').attr('src'), target.player);
    assert.equal($('iframe').attr('loading'), 'eager');
    assert.equal($('iframe').attr('title'), `Play ${target.title}`);
    assert.equal($('.game-stage').prev().get(0), $('h1').get(0), 'The playable window still follows the page title');
    assert.deepEqual($('.guide-controls tbody tr').toArray().map(row => [$(row).find('th').text(), $(row).find('td').text()]), target.controls);
    const directions = normalize($('#how-to-play').text());
    if (target.slug === 'ski-king') {
      assert.match(directions, /left.+right.+arrow keys/i);
      assert.doesNotMatch(directions, /\bjump\w*\b|\bWASD\b|\bW\s*\/\s*A\s*\/\s*S\s*\/\s*D\b/i);
    } else if (target.slug === 'ski-rush') {
      assert.match(directions, /mouse/i);
      assert.match(directions, /touch/i);
      assert.doesNotMatch(directions, /\barrow keys\b|\bWASD\b|\bW\s*\/\s*A\s*\/\s*S\s*\/\s*D\b|\bspacebar\b/i, 'Mouse/touch steering must not gain unsupported keyboard bindings');
    } else {
      assert.match(directions, /\bA\s*(?:\/|and)\s*D\b/i);
      assert.match(directions, /arrow keys/i);
    }
  });

  test(`${target.title} has informative visible FAQs that match one FAQPage exactly`, () => {
    const $ = page(target.slug);
    const faqs = visibleFaqs($);
    assert.ok(faqs.length >= 5);
    assert.equal(new Set(faqs.map(faq => faq.q)).size, faqs.length, 'Questions are distinct');
    for (const faq of faqs) {
      const sentences = faq.a.match(/[^.!?]+[.!?](?:\s|$)/g) ?? [];
      assert.ok(sentences.length >= 2, `${target.slug}: ${faq.q} gives more than a single generic sentence`);
    }
    if (target.slug === 'downhill-snowboard') {
      const comparisonFaq = faqs.find(faq => /SnowBoard Game/.test(faq.q));
      assert.ok(comparisonFaq, 'An FAQ explains the difference from SnowBoard Game');
      assert.match(comparisonFaq.a, /\bV\b.{0,30}\bgrab\b|\bgrab\b.{0,30}\bV\b/i);
      assert.doesNotMatch(comparisonFaq.a, /\b(?:switch|change|toggle)\w*\b.{0,30}\bcamera\b|\bcamera\b.{0,30}\b(?:switch|change|toggle)\w*\b/i);
    }
    const structured = schemas($);
    const faqSchemas = structured.filter(schema => schema['@type'] === 'FAQPage');
    assert.equal(faqSchemas.length, 1);
    assert.deepEqual(faqSchemas[0].mainEntity, faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })));
    const gameSchemas = structured.filter(schema => schema['@type'] === 'VideoGame');
    assert.equal(gameSchemas.length, 1);
    assert.equal(gameSchemas[0].name, target.title);
    assert.equal(gameSchemas[0].url, `https://sledgames.com/${target.slug}/`);
  });

  test(`${target.title} explains its linked alternative before related-game cards without skipping heading levels`, () => {
    const $ = page(target.slug);
    const comparison = $(`section#${target.slug}-comparison.game-comparison`);
    assert.equal(comparison.length, 1);
    const headingId = `${target.slug}-comparison-heading`;
    assert.equal(comparison.attr('aria-labelledby'), headingId);
    assert.equal(comparison.find(`> h2#${headingId}`).text(), `${target.title} vs ${target.otherTitle}`);
    assert.ok(comparison.find('> p').length >= 2, 'The comparison explains the difference in prose');
    assert.equal(comparison.find(`a[href="/${target.other}/"]`).length, 1);
    assert.equal(comparison.find(`a[href="${target.collection}"]`).length, 1);
    const comparisonText = normalize(comparison.find('p').text());
    if (target.slug === 'downhill-snowboard') {
      assert.match(comparisonText, /\b2D\b/i);
      assert.match(comparisonText, /\b3D\b/i);
      assert.match(comparisonText, /\bcoins?\b/i);
      assert.match(comparisonText, /\bfinish\b/i);
      assert.match(comparisonText, /\bV\b.{0,30}\bgrab\b|\bgrab\b.{0,30}\bV\b/i);
      assert.doesNotMatch(comparisonText, /\b(?:switch|change|toggle)\w*\b.{0,30}\bcamera\b|\bcamera\b.{0,30}\b(?:switch|change|toggle)\w*\b/i);
    } else {
      assert.match(comparisonText, /\bfinish\b|\btim\w*\b/i);
      assert.match(comparisonText, /\bsurviv\w*\b|\bscor\w*\b|\bpoints\b/i);
      assert.match(comparisonText, /\bflags?\b/i);
      assert.match(comparisonText, /\barrows?\b|\bkeyboard\b/i);
      assert.match(comparisonText, /\bmouse\b/i);
    }
    const relatedSection = $('main .game-grid').first().closest('section');
    assert.equal(relatedSection.length, 1);
    const mainNodes = $('main *').toArray();
    assert.ok(mainNodes.indexOf(comparison.get(0)) < mainNodes.indexOf(relatedSection.get(0)), 'Game-specific comparison precedes the recommendation cards');
    assert.equal(relatedSection.find('h2').length, 1, 'Related H3 card titles have a collection H2');
    let previousLevel = 0;
    $('main h1, main h2, main h3').each((_, node) => {
      const level = Number(node.tagName.slice(1));
      assert.ok(level <= previousLevel + 1, `${target.slug}: ${$(node).text()} skips H${previousLevel} to H${level}`);
      previousLevel = level;
    });
  });
}
