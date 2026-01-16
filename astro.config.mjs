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
		format: 'directory',
		inlineStylesheets: 'auto' // Automatically inline critical CSS for above-the-fold content
	},
	image: {
		service: {
			// Configure image optimization with Sharp
			entrypoint: 'astro/assets/services/sharp',
			config: {
				// Generate multiple formats for better browser compatibility
				formats: ['webp', 'avif', 'jpeg'],
				// Responsive image sizes
				sizes: [400, 800, 1200],
				// Quality settings
				quality: 80,
				// Enable lazy loading by default
				loading: 'lazy',
				// Decode images asynchronously
				decoding: 'async'
			}
		}
	},

	// Vite configuration for additional optimizations
	vite: {
		build: {
			rollupOptions: {
				output: {
					// Smaller, more efficient chunk naming
					chunkFileNames: 'chunks/[hash].js',
					entryFileNames: 'entry/[hash].js',
					assetFileNames: 'assets/[hash][extname]'
				}
			}
		}
	}
});
