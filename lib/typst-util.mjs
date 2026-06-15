#!/usr/bin/env node

/**
 * Typst compilation utilities
 * Shared by resume and cover letter generators
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync, statSync } from 'fs';
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
 * Scan candidate-facing text for em/en dashes (strong AI-writing signal).
 * Recursively walks objects/arrays/strings. Returns array of { path, snippet }
 * for each dash found. Throws if any dashes found.
 */
export function validateNoDashes(data, label = 'data') {
  const findings = [];

  function walk(obj, path) {
    if (typeof obj === 'string') {
      for (let i = 0; i < obj.length; i++) {
        const ch = obj[i];
        if (ch === '\u2014' || ch === '\u2013') {
          const start = Math.max(0, i - 15);
          const end = Math.min(obj.length, i + 15);
          const snippet = (start > 0 ? '...' : '') + obj.slice(start, end) + (end < obj.length ? '...' : '');
          findings.push({ path, snippet: snippet.trim() });
          return;
        }
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => walk(item, `${path}[${idx}]`));
      return;
    }
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        walk(value, `${path}.${key}`);
      }
    }
  }

  walk(data, label);

  if (findings.length > 0) {
    const lines = findings.map(f => `  ${f.path}: "${f.snippet}"`).join('\n');
    throw new Error(
      `Em/en dashes found in ${label}. These are strong AI-writing signals. Rewrite the sentences:\n${lines}`
    );
  }

  return true;
}

/**
 * Read a file and scan its text content for em/en dashes.
 * Skips markdown formatting elements that commonly use dashes as
 * meaningful syntax (horizontal rules, list markers in code fences).
 * Throws if any dashes found in candidate-facing text lines.
 */
export function validateFileNoDashes(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    // Skip markdown headers, code fences, and list markers
    if (/^\s*```/.test(line)) continue;
    if (/^\s*[-*]\s/.test(line) && /^\s*[-*]\s*\|/.test(line)) continue;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '\u2014' || ch === '\u2013') {
        const start = Math.max(0, i - 20);
        const end = Math.min(line.length, i + 20);
        const snippet = (start > 0 ? '...' : '') + line.slice(start, end).trim() + (end < line.length ? '...' : '');
        findings.push({ file: filePath, line: lineIdx + 1, snippet });
        break; // one finding per line is enough
      }
    }
  }

  if (findings.length > 0) {
    const lines = findings.map(f => `  ${f.file}:${f.line}: "${f.snippet}"`).join('\n');
    throw new Error(
      `Em/en dashes found in form answers. Rewrite the sentences:\n${lines}`
    );
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