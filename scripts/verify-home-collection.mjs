import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { load } from 'cheerio';
import postcss from 'postcss';

// Run against a saved pre-change checkout/build, without rebuilding either side:
// node scripts/verify-home-collection.mjs /path/to/baseline [report.json]
const baseline = process.argv[2] ?? process.env.HOME_COLLECTION_BASELINE;
if (!baseline) {
  console.error('Usage: node scripts/verify-home-collection.mjs BASELINE_DIRECTORY [REPORT_JSON]');
  process.exit(1);
}
const beforeRoot = resolve(baseline);
const afterRoot = process.cwd();
const checks = [];
const read = (root, path) => readFileSync(join(root, path), 'utf8');
const check = (name, verify) => {
  try { verify(); checks.push({ name, passed: true }); }
  catch (error) { checks.push({ name, passed: false, error: error.message }); }
};
function files(root, extension) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? files(join(root, entry.name), extension).map(path => join(entry.name, path))
    : entry.name.endsWith(extension) ? [entry.name] : []);
}
function document(html) {
  const $ = load(html, { sourceCodeLocationInfo: true });
  const raw = node => {
    assert.ok(node?.sourceCodeLocation, 'Missing element or original source location');
    return html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
  };
  return { $, raw, select: selector => $(selector).toArray().map(raw) };
}
function protectedHead(doc) {
  return doc.select('head title, head meta[name="description"], head link[rel="canonical"], head meta[property^="og:"], head meta[name="theme-color"], head link[rel~="icon"], head script:not([src^="/_astro/"])');
}
function headerWithCurrentSpans(doc) {
  let header = doc.select('header.site-header')[0];
  doc.$('header a[aria-current="page"]').each((_, node) => {
    const original = doc.raw(node);
    const replacement = original.replace(/^<a\b/, '<span').replace(/\s+href="[^"]*"/, '').replace(/<\/a>$/, '</span>');
    header = header.replace(original, replacement);
  });
  return header;
}
function normalizeBuildAssets(html) {
  return html.replace(/(\b(?:src|href)=")\/_astro\/[^"\s]+(?=")/g, '$1/_astro/BUILD_ASSET');
}
function cssRules(root) {
  const rules = new Map();
  const collect = css => {
    postcss.parse(css).walkRules(rule => {
      const contexts = [];
      for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
        if (parent.type === 'atrule') contexts.unshift(`@${parent.name} ${parent.params}`);
      }
      const signature = `${contexts.join('|')}|${rule.toString()}`;
      rules.set(signature, rule.selector);
    });
  };
  for (const path of files(join(root, 'dist'), '.css')) collect(read(root, join('dist', path)));
  for (const path of files(join(root, 'dist'), '.html')) {
    const $ = load(read(root, join('dist', path)));
    $('style').each((_, node) => collect($(node).text()));
  }
  return rules;
}

const pages = files(join(beforeRoot, 'dist'), '.html');
check('No URLs were added or removed', () => assert.deepEqual(files(join(afterRoot, 'dist'), '.html').sort(), [...pages].sort()));
for (const path of pages) {
  const oldHtml = read(beforeRoot, join('dist', path));
  const newHtml = read(afterRoot, join('dist', path));
  const before = document(oldHtml);
  const after = document(newHtml);
  check(`${path}: protected head tags and scripts are byte-identical`, () => assert.deepEqual(protectedHead(after), protectedHead(before)));
  check(`${path}: entire head is byte-identical apart from build asset names`, () => assert.equal(normalizeBuildAssets(after.select('head')[0]), normalizeBuildAssets(before.select('head')[0])));
  check(`${path}: footer is byte-identical`, () => assert.deepEqual(after.select('footer'), before.select('footer')));
  check(`${path}: only current navigation anchors became spans`, () => assert.equal(after.select('header.site-header')[0], headerWithCurrentSpans(before)));
  check(`${path}: H1 is byte-identical`, () => assert.deepEqual(after.select('main h1'), before.select('main h1')));
  if (path !== 'index.html') {
    check(`${path}: main is byte-identical`, () => assert.deepEqual(after.select('main'), before.select('main')));
    check(`${path}: all other HTML is unchanged apart from build assets`, () => assert.equal(
      normalizeBuildAssets(newHtml.replace(after.select('header.site-header')[0], '<header>SHARED_NAVIGATION</header>')),
      normalizeBuildAssets(oldHtml.replace(before.select('header.site-header')[0], '<header>SHARED_NAVIGATION</header>')),
    ));
  } else {
    for (const selector of ['section.page-intro', 'section.featured-games', 'article.hub-guide', 'section.faq', 'section.editorial-note']) {
      check(`Home ${selector} is byte-identical`, () => assert.deepEqual(after.select(selector), before.select(selector)));
    }
    check('Home changes are confined to the compact collection, navigation, and build assets', () => assert.equal(
      normalizeBuildAssets(newHtml.replace(after.select('header.site-header')[0], '<header>SHARED_NAVIGATION</header>').replace(after.select('.home-collection')[0], '')).replace(/>\s+</g, '><'),
      normalizeBuildAssets(oldHtml.replace(before.select('header.site-header')[0], '<header>SHARED_NAVIGATION</header>')).replace(/>\s+</g, '><'),
    ));
    check('Home ItemList still contains exactly the two sledding games', () => {
      const schemas = after.$('script[type="application/ld+json"]').toArray().map(node => JSON.parse(after.$(node).text()));
      assert.deepEqual(schemas.map(schema => schema['@type']).sort(), ['FAQPage', 'ItemList', 'WebSite']);
      assert.deepEqual(schemas.find(schema => schema['@type'] === 'ItemList').itemListElement.map(item => item.url), ['https://sledgames.com/sled-rider/', 'https://sledgames.com/snow-rider-2/']);
    });
    check('Home has 12 game cards and the required per-game card counts', () => {
      const counts = {};
      after.$('main a.game-card').each((_, node) => { const href = after.$(node).attr('href'); counts[href] = (counts[href] ?? 0) + 1; });
      const games = JSON.parse(read(afterRoot, 'data/games.json'));
      assert.equal(after.$('main a.game-card').length, 12);
      assert.deepEqual(counts, Object.fromEntries(games.map(game => [`/${game.slug}/`, ['sled-rider', 'snow-rider-2'].includes(game.slug) ? 2 : 1])));
    });
  }
  check(`${path}: no placeholder copy`, () => {
    const copy = after.$('body').clone().find('script,style').remove().end().text();
    assert.doesNotMatch(copy, /coming[-\s]+soon|\bempty\b|on\s+(?:the|its)\s+way/i);
  });
}
for (const path of ['data/games.json', 'src/components/GameGrid.astro', 'src/components/Footer.astro', 'dist/sitemap.xml', 'dist/robots.txt']) {
  check(`${path} is byte-identical`, () => assert.equal(read(afterRoot, path), read(beforeRoot, path)));
}
for (const path of files(join(beforeRoot, 'src'), '.css')) {
  check(`Existing stylesheet src/${path} is byte-identical apart from the compact stylesheet import`, () => {
    const current = read(afterRoot, join('src', path));
    const permitted = path === 'styles/global.css' ? current.replace(/^@import '\.\/compact-games\.css';\r?\n/m, '') : current;
    assert.equal(permitted, read(beforeRoot, join('src', path)));
  });
}
check('New compact CSS contains only compact selectors', () => {
  const path = join(afterRoot, 'src/styles/compact-games.css');
  assert.ok(existsSync(path));
  postcss.parse(readFileSync(path, 'utf8')).walkRules(rule => {
    assert.ok(rule.selector.split(',').every(selector => /\.game-(?:grid|card)--compact\b/.test(selector)), `Unexpected selector: ${rule.selector}`);
  });
});
check('Every previously built CSS rule is preserved; new rules apply only to compact cards or current navigation spans', () => {
  const previous = cssRules(beforeRoot);
  const current = cssRules(afterRoot);
  for (const rule of previous.keys()) assert.ok(current.has(rule), `Changed or removed CSS: ${rule}`);
  for (const [rule, selector] of current) {
    if (previous.has(rule)) continue;
    assert.ok(selector.split(',').every(part => /\.game-(?:grid|card)--compact\b/.test(part)
      || /(?:\.header-inner\s+nav|\.quick-links)\s*>\s*span\[aria-current\s*=\s*["']?page["']?\]/.test(part)), `Unexpected new CSS rule: ${rule}`);
  }
});
const report = { baseline: beforeRoot, checkedAt: new Date().toISOString(), passed: checks.every(check => check.passed), checks };
if (process.argv[3]) {
  const reportPath = resolve(process.argv[3]);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
