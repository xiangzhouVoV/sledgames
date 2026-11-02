import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sledgames.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    server: {
      proxy: {
        '^/api(?:/|$)': {
          target: 'http://127.0.0.1:8788',
          // Preserve the browser origin for the backend's same-origin check.
          changeOrigin: false,
        },
      },
    },
  },
});
