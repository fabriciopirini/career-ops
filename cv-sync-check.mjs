#!/usr/bin/env node
/**
 * Minimal source check before pipeline/evaluation runs.
 * Keeps workflow from failing when the old sync-check script is missing.
 */
import { existsSync } from 'fs';
import { resolve } from 'path';

const required = [
  'cv.md',
  'config/profile.yml',
  'modes/_profile.md',
  'portals.yml',
];

const optional = [
  'article-digest.md',
  '../portfolio/lib/career-data.ts',
  '../portfolio/lib/site-copy.ts',
];

let failed = false;

for (const path of required) {
  if (!existsSync(resolve(path))) {
    console.error(`❌ Missing required source: ${path}`);
    failed = true;
  }
}

for (const path of optional) {
  if (!existsSync(resolve(path))) {
    console.log(`ℹ️  Optional source not found: ${path}`);
  }
}

if (failed) process.exit(1);
console.log('✅ Career sources present');
