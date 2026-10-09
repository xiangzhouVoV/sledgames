import type { APIRoute } from 'astro';
import { allPaths, canonical } from '../lib/catalog.mjs';
export const GET: APIRoute = () => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allPaths.map(path => `<url><loc>${canonical(path)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
