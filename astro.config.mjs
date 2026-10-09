import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sledgames.com',
  output: 'static',
  trailingSlash: 'never',
  redirects: { '/sled-rider': { status: 301, destination: '/' } },
  build: { format: 'directory' },
});
