import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sledgames.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
});
