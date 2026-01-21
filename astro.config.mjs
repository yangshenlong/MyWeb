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
		// Pagefind 在构建后生成，需要特殊处理
		optimizeDeps: {
			exclude: ['/pagefind/pagefind.js']
		},
		build: {
			rollupOptions: {
				output: {
					// Smaller, more efficient chunk naming
					chunkFileNames: 'chunks/[hash].js',
					entryFileNames: 'entry/[hash].js',
					assetFileNames: 'assets/[hash][extname]',
					// 代码分割优化
					manualChunks: (id) => {
						// 将 node_modules 中的代码打包到 vendor chunk
						if (id.includes('node_modules')) {
							// 特定库单独打包
							if (id.includes('pagefind')) {
								return 'vendor.pagefind';
							}
							return 'vendor';
						}
					}
				},
				// 排除 Pagefind 模块
				external: ['/pagefind/pagefind.js']
			},
			// 启用 CSS 代码分割
			cssCodeSplit: true,
			// 设置 chunk 大小警告限制
			chunkSizeWarningLimit: 500
		},
		// CSS 优化
		css: {
			devSourcemap: true
		},
		// 服务器配置
		server: {
			// 端口
			port: 4321,
			// 监听所有地址
			host: true
		}
	}
});
