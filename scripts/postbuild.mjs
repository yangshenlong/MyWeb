#!/usr/bin/env node

/**
 * Post-build script for running Pagefind indexing
 * 运行在构建之后，自动生成搜索索引
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const distPath = join(process.cwd(), 'dist');
const pagefindPath = join(process.cwd(), 'node_modules', '.bin', 'pagefind');

console.log('🔍 Running Pagefind indexing...');

try {
  // 确保 dist 目录存在
  if (!existsSync(distPath)) {
    console.error('❌ Dist directory not found. Run build first.');
    process.exit(1);
  }

  // 运行 Pagefind 索引
  const command = `"${pagefindPath}" --site "${distPath}"`;
  execSync(command, { stdio: 'inherit' });

  console.log('✅ Pagefind indexing completed!');
} catch (error) {
  console.error('❌ Pagefind indexing failed:', error);
  process.exit(1);
}
