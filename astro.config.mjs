// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Get site URL from environment variable or use default
const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://yourname.github.io';

// https://astro.build/config
export default defineConfig({
	site: siteUrl,
	integrations: [mdx(), sitemap()],
	build: {
		format: 'directory'
	}
});
