import { games, relatedGames, categories, categoryGames } from '../src/lib/catalog.mjs';
import { readFileSync } from 'node:fs';

const errors = [];
const contact = readFileSync('dist/contact/index.html', 'utf8');
if (!contact.includes('href="mailto:')) errors.push('Configure a real PUBLIC_CONTACT_EMAIL and rebuild.');
const required = ['sled-rider', 'snowball-io', 'moto-x3m-winter', 'snow-rider-2', 'snow-drift', 'slope-rider-2', 'ski-simulator', 'snowboard-simulator'];
for (const slug of required) if (!games.some(game => game.slug === slug)) errors.push(`Add and verify the required game: ${slug}.`);
for (const game of games) {
  if (!game.embed.iframeSrc) errors.push(`${game.slug}: official publisher embed is not configured.`);
  if (!game.intro || !game.howToPlay.length || !game.tips.length) errors.push(`${game.slug}: verify and complete game information.`);
  if (relatedGames(game).length < 5) errors.push(`${game.slug}: add 5–8 related game links.`);
  if (game.faqs.filter(faq => faq.q && faq.a).length < 5) errors.push(`${game.slug}: at least 5 complete FAQs required.`);
}
for (const category of categories) if (!categoryGames(category.slug).length) errors.push(`${category.slug}: category has no games.`);
if (errors.length) {
  console.error('Launch prerequisites are incomplete:\n' + errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else console.log('Catalog and contact launch prerequisites passed. Verify publisher authorization, performance, and hosting before launch.');
