import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sledgames.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
