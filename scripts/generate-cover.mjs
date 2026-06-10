#!/usr/bin/env node

/**
 * Generate cover letter PDF via Typst
 *
 * Reads body text (or from file), constructs data.json, compiles cover-letter.typ.
 *
 * Usage:
 *   node scripts/generate-cover.mjs <output.pdf> --body="text..." [options]
 *   node scripts/generate-cover.mjs <output.pdf> --body-file=<path> [options]
 *
 * Options:
 *   --company="Acme Corp"         Company name for greeting
 *   --date="May 29, 2026"          Date (default: today)
 *   --watch                        Watch mode: auto-recompile on changes
 *   --dry-run                      Show data preview, skip compilation
 *   --validate                     Validate data structure, skip compilation
 */

import { readFile, mkdir, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG, log, DATA_FILE } from '../lib/config.mjs';
import { compileTypst, writeDataJson, cleanupDataJson, showDataPreview, validateData, validateNoDashes } from '../lib/typst-util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Cover letter data schema for validation
 */
const COVER_SCHEMA = {
  name: 'string',
  subtitle: 'string',
  location: 'string',
  contact: 'array',
  date: 'string',
  greeting: 'string',
  paragraphs: 'array',
  closing: 'string',
};

async function buildCoverData(body, opts) {
  const paragraphs = body
    .split('\n\n')
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    throw new Error('No body text provided');
  }

  const date = opts.date || new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const greeting = opts.company
    ? `Dear ${opts.company} Hiring Team,`
    : 'Dear Hiring Team,';

  return {
    name: 'Fabricio Tramontano Pirini',
    subtitle: 'Full Stack Engineer',
    location: 'Brazil (UTC -3)',
    contact: [
      { text: 'fabricio@fabriciopirini.com' },
      { text: 'linkedin.com/in/fabriciopirini' },
      { text: 'github.com/fabriciopirini' },
      { text: 'fabriciopirini.com' },
    ],
    date,
    greeting,
    paragraphs,
    closing: 'Best regards,',
  };
}

async function main() {
  const args = process.argv.slice(2);
  let output = null;
  let body = null;
  let bodyFile = null;
  let date = null;
  let company = null;
  let watch = false;
  let dryRun = false;
  let validateOnly = false;

  for (const arg of args) {
    if (arg.startsWith('--body-file=')) { bodyFile = arg.split('=')[1]; continue; }
    if (arg.startsWith('--date=')) { date = arg.split('=')[1]; continue; }
    if (arg.startsWith('--company=')) { company = arg.split('=')[1]; continue; }
    if (arg.startsWith('--body=')) { body = arg.split('=')[1]; continue; }
    if (arg === '--watch') { watch = true; continue; }
    if (arg === '--dry-run') { dryRun = true; continue; }
    if (arg === '--validate') { validateOnly = true; continue; }
    if (!arg.startsWith('--') && !output) { output = resolve(process.cwd(), arg); }
  }

  // Handle --body-file (read file after args parsed)
  if (!body && bodyFile) {
    body = await readFile(resolve(process.cwd(), bodyFile), 'utf-8');
  }

  if (!output || !body) {
    console.error(`
Usage: node scripts/generate-cover.mjs <output.pdf> --body="text..." [options]
   or: node scripts/generate-cover.mjs <output.pdf> --body-file=<path> [options]

Options:
  --company="Acme Corp"         Company name for greeting
  --date="May 29, 2026"          Date (default: today)
  --watch                        Watch mode: auto-recompile on changes
  --dry-run                      Show data preview, skip compilation
  --validate                     Validate data structure, skip compilation
`);
    process.exit(1);
  }

  // Build Typst data
  const coverData = await buildCoverData(body, { date, company });

  // Check for em/en dashes (AI-writing signal) — fail early
  try {
    validateNoDashes(coverData, 'cover-letter');
  } catch (e) {
    log.e(e.message);
    process.exit(1);
  }

  // Validate if requested
  if (validateOnly) {
    log.i('Validating data structure...');
    try {
      validateData(coverData, COVER_SCHEMA);
      log.s('Data validation passed');
    } catch (e) {
      log.e(e.message);
      process.exit(1);
    }
    return;
  }

  // Show preview if dry-run
  if (dryRun) {
    showDataPreview(coverData);
    return;
  }

  // Write data.json
  await writeDataJson(coverData, DATA_FILE);

  // Create output directory
  await mkdir(dirname(output), { recursive: true });

  // Compile with Typst
  const templatePath = resolve(process.cwd(), 'templates/cover-letter.typ');
  try {
    compileTypst(templatePath, output, { watch });
  } catch (e) {
    log.i(`Data JSON preserved at: ${DATA_FILE}`);
    process.exit(1);
  }

  // Clean up data.json only if not in watch mode
  if (!watch) {
    await cleanupDataJson(DATA_FILE);
  }

  // Output path for chaining
  if (!watch) {
    process.stdout.write(output + '\n');
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});