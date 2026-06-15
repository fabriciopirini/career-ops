#!/usr/bin/env node

/**
 * Validate form-answers.md files for em/en dashes.
 * Called automatically by application-prep workflow.
 *
 * Usage:
 *   node scripts/validate-form-answers.mjs output/garage/2026-06-11-founding-design-engineer/
 *
 * Exits 0 if clean, 1 with error messages if dashes found.
 */

import { resolve, join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { log } from '../lib/config.mjs';
import { validateFileNoDashes } from '../lib/typst-util.mjs';

const targetDir = process.argv[2];

if (!targetDir) {
  log.e('Usage: node scripts/validate-form-answers.mjs <output-dir>');
  process.exit(1);
}

const dir = resolve(targetDir);

if (!existsSync(dir)) {
  log.e(`Directory not found: ${dir}`);
  process.exit(1);
}

// Find all form-answers.md files in the directory tree
const mdFiles = [];

function walkDir(currentPath) {
  const entries = readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name === 'form-answers.md') {
      mdFiles.push(fullPath);
    }
  }
}

walkDir(dir);

if (mdFiles.length === 0) {
  log.w(`No form-answers.md files found in ${dir}`);
  process.exit(0);
}

let allClean = true;

for (const filePath of mdFiles) {
  try {
    validateFileNoDashes(filePath);
    log.s(`✅ ${filePath} — clean`);
  } catch (err) {
    log.e(`❌ ${filePath} — dashes found`);
    console.error(err.message);
    allClean = false;
  }
}

if (!allClean) {
  process.exit(1);
}
