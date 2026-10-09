import rawGames from '../../data/games.json' with { type: 'json' };

export const SITE = 'https://sledgames.com';
export const legalRoutes = ['about', 'contact', 'privacy-policy', 'terms-of-use', 'copyright'];
export const categories = [
  { slug: 'sledding-games', path: '/', title: 'Sled Games', label: 'Sledding', symbol: '01', description: 'A little snow. A lot of momentum.' },
  { slug: 'snowboard-games', path: '/snowboard-games', title: 'Snowboard Games', label: 'Snowboarding', symbol: '02', description: 'Find your line down the mountain.' },
  { slug: 'ski-games', path: '/ski-games', title: 'Ski Games', label: 'Skiing', symbol: '03', description: 'Fresh tracks, right in your browser.' },
];

const hosts = {
  gamedistribution: new Set(['html5.gamedistribution.com']),
  gamemonetize: new Set(['html5.gamemonetize.com']),
  azgames: new Set(['gamea.azgame.io']),
};

export function canonical(path = '/') {
  return new URL(path, SITE).href;
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
  // Only the verified Sled Rider player is enabled for this publisher.
  if (provider === 'azgames' && url.pathname !== '/sled-rider/') {
    throw new Error(`${game.slug}: unverified AZGames player path`);
  }
  return url.href;
}

export function hasSource(game, field) {
  return Boolean(game.sources?.[field]?.trim());
}

/** @param {import('./types').Game[]} entries */
export function validateGames(entries) {
  const slugs = new Set();
  const reserved = new Set(['games', '404', ...legalRoutes, ...categories.map(c => c.path.slice(1)).filter(Boolean)]);
  for (const game of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug) || slugs.has(game.slug) || reserved.has(game.slug)) {
      throw new Error(`Invalid, duplicate, or reserved game slug: ${game.slug}`);
    }
    slugs.add(game.slug);
    if (!game.title?.trim() || !game.description?.trim()) throw new Error(`${game.slug}: missing title or description`);
    if (game.description.length < 140 || game.description.length > 160) throw new Error(`${game.slug}: description must have 140–160 characters`);
    if (!game.category?.length || game.category.some(slug => !categories.some(c => c.slug === slug))) {
      throw new Error(`${game.slug}: unknown category`);
    }
    if (!(game.embed?.width > 0 && game.embed?.height > 0)) throw new Error(`${game.slug}: invalid embed dimensions`);
    embedUrl(game, canonical(`/${game.slug}`));
    for (const field of ['intro', 'howToPlay', 'tips', 'items', 'rating', 'playCount']) {
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
export const allPaths = ['/', '/games', ...categories.filter(c => c.path !== '/').map(c => c.path), ...games.map(g => `/${g.slug}`), ...legalRoutes.map(slug => `/${slug}`)];
/** @param {import('./types').Game} game */
export const relatedGames = game => game.similar.map(slug => games.find(g => g.slug === slug)).filter(entry => entry !== undefined);
export const categoryGames = slug => games.filter(game => game.category.includes(slug));
export const gameFaqs = game => game.faqs.filter(faq => faq.q?.trim() && faq.a?.trim());

export function gameSchema(game) {
  return {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: game.title,
    url: canonical(`/${game.slug}`), applicationCategory: 'Game', operatingSystem: 'Web Browser',
    ...(game.intro ? { description: game.intro } : {}),
    ...(game.developer ? { author: { '@type': 'Organization', name: game.developer } } : {}),
    ...(game.released ? { datePublished: game.released } : {}),
    // Do not assert pricing or playability until an authorized embed is configured.
    ...(game.embed.iframeSrc ? { offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' } } : {}),
  };
}

export function faqSchema(faqs) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) };
}

export function serializeSchema(data) {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
