#!/usr/bin/env node

/**
 * Typst compilation utilities
 * Shared by resume and cover letter generators
 */

import { execSync, spawn } from 'child_process';
import { existsSync, unlinkSync, statSync } from 'fs';
import { resolve } from 'path';
import { CONFIG, log } from './config.mjs';

/**
 * Compile a Typst template to PDF
 */
export function compileTypst(templatePath, outputPath, options = {}) {
  const { watch = false } = options;

  const args = ['compile', '--font-path', CONFIG.FONT_PATH, templatePath, outputPath];

  if (watch) {
    args.unshift('watch');
    log.i(`Starting Typst watch mode: ${outputPath}`);
    log.i('Press Ctrl+C to stop');
  } else {
    log.i(`Compiling with Typst: ${outputPath}...`);
  }

  try {
    if (watch) {
      // Watch mode: spawn process and keep it alive
      const proc = spawn(CONFIG.TYPST_BIN, args, { cwd: process.cwd(), stdio: 'inherit' });

      proc.on('error', (err) => {
        log.e(`Typst failed to start: ${err.message}`);
        process.exit(1);
      });

      proc.on('exit', (code) => {
        if (code !== 0) {
          log.e(`Typst exited with code ${code}`);
          process.exit(1);
        }
      });

      return proc;
    } else {
      // Normal compile: execSync
      execSync(`${CONFIG.TYPST_BIN} ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    }
  } catch (e) {
    log.e('Typst compilation failed');
    throw e;
  }

  // Report file size
  if (!watch && existsSync(outputPath)) {
    const stats = statSync(outputPath);
    log.s(`PDF: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  }
}

/**
 * Write data.json for Typst template
 */
export async function writeDataJson(data, dataPath = CONFIG.DATA_FILE) {
  const { writeFile } = await import('fs/promises');
  await writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  log.i(`Data JSON written: ${dataPath}`);
}

/**
 * Clean up data.json
 */
export async function cleanupDataJson(dataPath = CONFIG.DATA_FILE) {
  try {
    const { unlink } = await import('fs/promises');
    await unlink(dataPath);
  } catch {
    // File doesn't exist, that's fine
  }
}

/**
 * Validate data structure against expected schema
 */
export function validateData(data, schema) {
  const errors = [];

  for (const [key, type] of Object.entries(schema)) {
    if (data[key] === undefined) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    if (type === 'array' && !Array.isArray(data[key])) {
      errors.push(`Field ${key} must be an array`);
    }

    if (type === 'string' && typeof data[key] !== 'string') {
      errors.push(`Field ${key} must be a string`);
    }

    if (type === 'object' && typeof data[key] !== 'object') {
      errors.push(`Field ${key} must be an object`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Data validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return true;
}

/**
 * Show data preview (dry-run mode)
 */
export function showDataPreview(data) {
  log.i('=== DATA PREVIEW ===');
  console.log(JSON.stringify(data, null, 2));
  log.i('=== END PREVIEW ===');
}