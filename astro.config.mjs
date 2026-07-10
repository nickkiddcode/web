// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.nickkidd.net',
  // Astro 5: static by default with per-route opt-out — no 'hybrid' mode.
  // Site pages stay prerendered; only Keystatic's injected admin/API routes render on demand.
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react(), markdoc(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
  },
});
