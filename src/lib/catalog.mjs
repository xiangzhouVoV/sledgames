import rawGames from '../../data/games.json' with { type: 'json' };

export const SITE = 'https://sledgames.com';
export const winterCollection = { slug: 'winter-games', title: 'All Winter Games', path: '/games/', label: 'Winter' };
/** @param {string} path */
export const pagePath = path => path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
/** @param {string} slug */
export const gamePath = slug => pagePath(`/${slug}`);
export const legalRoutes = ['about', 'contact', 'privacy-policy', 'terms-of-use', 'copyright'];
export const categories = [
  { slug: 'sledding-games', path: '/', title: 'Sled Games', label: 'Sledding', symbol: '01', description: 'A little snow. A lot of momentum.' },
  { slug: 'snowboard-games', path: '/snowboard-games/', title: 'Snowboard Games', label: 'Snowboarding', symbol: '02', description: 'Find your line down the mountain.' },
  { slug: 'ski-games', path: '/ski-games/', title: 'Ski Games', label: 'Skiing', symbol: '03', description: 'Fresh tracks, right in your browser.' },
  { slug: 'christmas-games', path: '/christmas-games/', title: 'Christmas Games', label: 'Christmas', symbol: '04', description: 'Catch gifts, fly with Santa, or combine festive snowballs in Merge Christmas. On mobile, try Merge Christmas or Crazy Christmas Fun.' },
];
const gameCategories = [...categories, winterCollection];
/** @param {import('./types').Game} game */
export const gameCategory = game => gameCategories.find(category => category.slug === game.category[0]);

const hosts = {
  gamedistribution: new Set(['html5.gamedistribution.com']),
  gamemonetize: new Set(['html5.gamemonetize.com', 'html5.gamemonetize.co', 'html5.gamemonetize.games', 'io.gamemonetize.com']),
  azgames: new Set(['gamea.azgame.io']),
  gamepix: new Set(['play.gamepix.com']),
};
const externalDestinations = new Map([
  ['sleigh-o-balance', { url: 'https://xxchester.itch.io/sleigh-o-balance', name: 'itch.io' }],
  ['waddle-peaks', { url: 'https://play.benerits.com/en/g/waddle-peaks', name: 'Benerits' }],
  ['snow-riders', { url: 'https://poki.com/en/g/snow-riders', name: 'Poki' }],
]);

/** @param {import('./types').Game} game */
export const externalPlayLabel = game => externalDestinations.get(game.slug)?.name;

export function canonical(path = '/') {
  return new URL(pagePath(path), SITE).href;
}

export function embedUrl(game, pageUrl) {
  const { provider, iframeSrc } = game.embed;
  if (!iframeSrc) return null;
  const url = new URL(iframeSrc.replaceAll('{{PAGE_URL}}', encodeURIComponent(pageUrl)));
  if (url.protocol !== 'https:' || !hosts[provider]?.has(url.hostname) || url.username || url.password) {
    throw new Error(`${game.slug}: only official HTTPS publisher embeds are allowed`);
  }
  if (provider === 'gamedistribution') {
    url.searchParams.set('gd_sdk_referrer_url', pageUrl);
  }
  if (url.hostname === 'io.gamemonetize.com' && url.pathname !== '/snowwar/') {
    throw new Error(`${game.slug}: unverified GameMonetize IO player path`);
  }
  // Only the verified Sled Rider player is enabled for this publisher.
  if (provider === 'azgames' && url.pathname !== '/sled-rider/') {
    throw new Error(`${game.slug}: unverified AZGames player path`);
  }
  if (provider === 'gamepix' && !['/gnome-bobsled/embed', '/sled-line/embed'].includes(url.pathname)) {
    throw new Error(`${game.slug}: unverified GamePix player path`);
  }
  return url.href;
}

export function hasSource(game, field) {
  return Boolean(game.sources?.[field]?.trim());
}

/** @param {import('./types').Game[]} entries */
export function validateGames(entries) {
  const slugs = new Set();
  const reserved = new Set(['games', '404', ...legalRoutes, ...categories.filter(c => c.path !== '/').map(c => c.slug)]);
  for (const game of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug) || slugs.has(game.slug) || reserved.has(game.slug)) {
      throw new Error(`Invalid, duplicate, or reserved game slug: ${game.slug}`);
    }
    slugs.add(game.slug);
    if (!game.title?.trim() || !game.description?.trim()) throw new Error(`${game.slug}: missing title or description`);
    if (game.description.length < 130 || game.description.length > 160) throw new Error(`${game.slug}: description must have 130–160 characters`);
    if (!game.category?.length || game.category.some(slug => !gameCategories.some(c => c.slug === slug))) {
      throw new Error(`${game.slug}: unknown category`);
    }
    if (!(game.embed?.width > 0 && game.embed?.height > 0)) throw new Error(`${game.slug}: invalid embed dimensions`);
    embedUrl(game, canonical(gamePath(game.slug)));
    if (game.externalPlayUrl && (game.embed.iframeSrc || game.externalPlayUrl !== externalDestinations.get(game.slug)?.url)) {
      throw new Error(`${game.slug}: unverified external game destination`);
    }
    for (const field of ['intro', 'howToPlay', 'tips', 'controls', 'items', 'rating', 'playCount']) {
      const value = game[field];
      const populated = Array.isArray(value) ? value.length > 0 : value != null && value !== '';
      if (populated && !hasSource(game, field)) throw new Error(`${game.slug}: ${field} needs a source`);
    }
    if (game.rating != null && (!(game.rating.value >= 0 && game.rating.value <= 5) || !Number.isInteger(game.rating.count) || game.rating.count <= 0)) {
      throw new Error(`${game.slug}: invalid rating`);
    }
    if (game.playCount != null && (!Number.isInteger(game.playCount) || game.playCount < 0)) throw new Error(`${game.slug}: invalid play count`);
    if (game.released && !/^\d{4}-\d{2}-\d{2}$/.test(game.released)) throw new Error(`${game.slug}: release date must use YYYY-MM-DD`);
  }
  for (const game of entries) {
    if (new Set(game.similar).size !== game.similar.length || game.similar.some(slug => !slugs.has(slug) || slug === game.slug)) {
      throw new Error(`${game.slug}: related games must be unique existing game slugs`);
    }
  }
  return entries;
}

/** @type {import('./types').Game[]} */
export const games = validateGames(rawGames);
export const allPaths = [...new Set(['/', '/games/', ...categories.filter(c => c.path !== '/').map(c => c.path), ...games.map(g => gamePath(g.slug)), ...legalRoutes.map(slug => pagePath(`/${slug}`))])];
export const RELATED_GAME_LIMIT = 5;
/**
 * Prefer the same category, then the winter pool, then the full winter catalog.
 * Editorial selections order peers within each group without excluding new games.
 * @param {import('./types').Game} game
 * @param {import('./types').Game[]} entries
 */
export function relatedGames(game, entries = games) {
  const seen = new Set([game.slug]);
  const candidates = entries.filter(entry => {
    if (seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
  const preferred = new Map(game.similar.map((slug, index) => [slug, index]));
  /** @param {import('./types').Game} entry */
  const priority = entry => entry.category.some(slug => game.category.includes(slug)) ? 0
    : entry.category.some(slug => slug === 'sledding-games' || slug === winterCollection.slug) ? 1 : 2;
  return candidates.sort((left, right) => priority(left) - priority(right)
    || (preferred.get(left.slug) ?? preferred.size) - (preferred.get(right.slug) ?? preferred.size)).slice(0, RELATED_GAME_LIMIT);
}
export const categoryGames = slug => games.filter(game => game.category.includes(slug));
export const gameFaqs = game => game.faqs.filter(faq => faq.q?.trim() && faq.a?.trim());

export function gameSchema(game) {
  return {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: game.title,
    url: canonical(gamePath(game.slug)), applicationCategory: 'Game', operatingSystem: 'Web Browser',
    ...(game.intro ? { description: game.intro } : {}),
    ...(game.developer ? { author: { '@type': 'Organization', name: game.developer } } : {}),
    ...(game.released ? { datePublished: game.released } : {}),
    // Assert free access only when a verified play destination is configured.
    ...(game.embed.iframeSrc || game.externalPlayUrl ? { offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' } } : {}),
  };
}

export function faqSchema(faqs) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) };
}

/** @param {{ name: string, path: string }[]} trail */
export function breadcrumbSchema(trail) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Sled Games', path: '/' }, ...trail].map((entry, index) => ({
      '@type': 'ListItem', position: index + 1, name: entry.name, item: canonical(entry.path),
    })),
  };
}

/** @param {import('./types').Game[]} entries @param {string} [name] */
export function itemListSchema(entries, name = winterCollection.title) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', name,
    itemListElement: entries.map((game, index) => ({
      '@type': 'ListItem', position: index + 1, name: game.title, url: canonical(gamePath(game.slug)),
    })),
  };
}

export function serializeSchema(data) {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
