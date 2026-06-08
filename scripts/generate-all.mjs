#!/usr/bin/env node

/**
 * Generate both resume and cover letter PDFs in one command
 *
 * Shared workflow: applies same override to both documents.
 *
 * Usage:
 *   node scripts/generate-all.mjs --company="Acme" [options]
 *
 * Options:
 *   --company="Acme"               Company name (used for filenames and greeting)
 *   --role="Senior Frontend"        Role title (optional, appended to folder name)
 *   --variant=default|growth|product   Portfolio variant (default: default)
 *   --override=<path>              Override JSON for subtitle/summary/bullets
 *   --body="text..."               Cover letter body text
 *   --body-file=<path>             Cover letter body text from file
 *   --date="May 29, 2026"          Date (default: today)
 *   --watch                        Watch mode: auto-recompile on changes
 *   --dry-run                      Show data previews, skip compilation
 *   --validate                     Validate data structures, skip compilation
 *   --output-dir=<path>            Output directory (default: output/)
 *
 * Directory structure:
 *   output/{company-slug}/{YYYY-MM-DD}[-{role-slug}]/
 *     Fabricio-Pirini-Resume.pdf
 *     Fabricio-Pirini-Cover-Letter.pdf
 */

import { mkdir, readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '../lib/config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function generateResume(output, variant, overridePath, flags) {
  const args = [output, `--variant=${variant}`];
  if (overridePath) args.push(`--override=${overridePath}`);
  if (flags.watch) args.push('--watch');
  if (flags.dryRun) args.push('--dry-run');
  if (flags.validate) args.push('--validate');

  const { exec } = await import('child_process');
  return new Promise((resolve_, reject) => {
    const proc = exec(`node ${resolve(__dirname, 'generate-resume.mjs')} ${args.join(' ')}`, {
      cwd: process.cwd(),
    });
    proc.stdout?.on('data', (data) => process.stdout.write(data));
    proc.stderr?.on('data', (data) => process.stderr.write(data));
    proc.on('close', (code) => {
      if (code === 0) resolve_();
      else reject(new Error(`Resume generation failed with code ${code}`));
    });
  });
}

async function generateCover(output, body, company, date, flags) {
  const args = [output, `--body=${body}`];
  if (company) args.push(`--company=${company}`);
  if (date) args.push(`--date=${date}`);
  if (flags.watch) args.push('--watch');
  if (flags.dryRun) args.push('--dry-run');
  if (flags.validate) args.push('--validate');

  const { exec } = await import('child_process');
  return new Promise((resolve_, reject) => {
    const proc = exec(`node ${resolve(__dirname, 'generate-cover.mjs')} ${args.join(' ')}`, {
      cwd: process.cwd(),
    });
    proc.stdout?.on('data', (data) => process.stdout.write(data));
    proc.stderr?.on('data', (data) => process.stderr.write(data));
    proc.on('close', (code) => {
      if (code === 0) resolve_();
      else reject(new Error(`Cover letter generation failed with code ${code}`));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let company = null;
  let role = null;
  let variant = 'default';
  let overridePath = null;
  let body = null;
  let bodyFile = null;
  let date = null;
  let outputDir = 'output';
  let watch = false;
  let dryRun = false;
  let validateOnly = false;

  for (const arg of args) {
    if (arg.startsWith('--company=')) { company = arg.split('=')[1]; continue; }
    if (arg.startsWith('--role=')) { role = arg.split('=')[1]; continue; }
    if (arg.startsWith('--variant=')) { variant = arg.split('=')[1]; continue; }
    if (arg.startsWith('--override=')) { overridePath = resolve(process.cwd(), arg.split('=')[1]); continue; }
    if (arg.startsWith('--body=')) { body = arg.split('=')[1]; continue; }
    if (arg.startsWith('--body-file=')) { bodyFile = arg.split('=')[1]; continue; }
    if (arg.startsWith('--date=')) { date = arg.split('=')[1]; continue; }
    if (arg.startsWith('--output-dir=')) { outputDir = resolve(process.cwd(), arg.split('=')[1]); continue; }
    if (arg === '--watch') { watch = true; continue; }
    if (arg === '--dry-run') { dryRun = true; continue; }
    if (arg === '--validate') { validateOnly = true; continue; }
  }

  if (!company || !role) {
    console.error(`
Usage: node scripts/generate-all.mjs --company="Acme" --role="Senior Frontend" [options]

Options:
  --company="Acme"               Company name (used for filenames and greeting)
  --role="Senior Frontend"        Role title (optional, appended to folder name)
  --variant=default|growth|product   Portfolio variant (default: default)
  --override=<path>              Override JSON for subtitle/summary/bullets
  --body="text..."               Cover letter body text
  --body-file=<path>             Cover letter body text from file
  --date="May 29, 2026"          Date (default: today)
  --output-dir=<path>            Output directory (default: output/)
  --watch                        Watch mode: auto-recompile on changes
  --dry-run                      Show data previews, skip compilation
  --validate                     Validate data structures, skip compilation

Directory structure:
  output/{company-slug}/{YYYY-MM-DD}-{role-slug}/
`);
    process.exit(1);
  }

  if (!body && bodyFile) {
    body = await readFile(resolve(process.cwd(), bodyFile), 'utf-8');
  }

  if (!body && !dryRun && !validateOnly && !watch) {
    log.w('No cover letter body provided. Use --body or --body-file');
  }

  // Build path: output/{company-slug}/{YYYY-MM-DD}-{role-slug}/
  const companySlug = slugify(company);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dir = resolve(outputDir, companySlug, `${today}-${slugify(role)}`);
  await mkdir(dir, { recursive: true });

  const resumePath = resolve(dir, 'Fabricio-Pirini-Resume.pdf');
  const coverPath = resolve(dir, 'Fabricio-Pirini-Cover-Letter.pdf');

  const flags = { watch, dryRun, validate: validateOnly };
  const label = role ? `${company} — ${role}` : company;
  log.i(`Generating for: ${label}`);

  log.i('--- RESUME ---');
  await generateResume(resumePath, variant, overridePath, flags);

  if (body || watch) {
    log.i('--- COVER LETTER ---');
    await generateCover(coverPath, body || 'Cover letter body', company, date, flags);
  }

  log.s('--- DONE ---');

  if (!dryRun && !validateOnly && !watch) {
    console.log(`\nGenerated files:`);
    console.log(`  ${resumePath}`);
    if (body) console.log(`  ${coverPath}`);
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
