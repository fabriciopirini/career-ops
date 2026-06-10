#!/usr/bin/env node

/**
 * Generate resume PDF via Typst
 *
 * Reads career data from portfolio (via tsx), applies overrides,
 * writes JSON, shells out to typst compile. No react-pdf, no Playwright.
 *
 * Usage:
 *   node scripts/generate-resume.mjs <output.pdf> [options]
 *
 * Options:
 *   --variant=default|growth|product   Portfolio variant (default: default)
 *   --override=<path>                  Override JSON for subtitle/summary/bullets
 *   --watch                            Watch mode: auto-recompile on changes
 *   --dry-run                          Show data preview, skip compilation
 *   --validate                         Validate data structure, skip compilation
 *
 * Override JSON format:
 *   {
 *     "subtitle": "Custom title",
 *     "summary": "Custom summary...",
 *     "bullets": {
 *       "crypto-exchange": { "0": ["Custom bullet 1", "Custom bullet 2"] }
 *     }
 *   }
 */

import { readFile, mkdir, writeFile, unlink } from 'fs/promises';
import { writeFileSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG, log, VALID_VARIANTS, validateVariant, DATA_FILE } from '../lib/config.mjs';
import { compileTypst, writeDataJson, cleanupDataJson, showDataPreview, validateData, validateNoDashes } from '../lib/typst-util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Import career data from portfolio via tsx.
 * Writes a temp .cjs script that tsx can import, runs it, parses JSON.
 */
function importData(variant) {
  const tmp = resolve(CONFIG.PORTFOLIO_DIR, '.tmp-extract.cjs');
  const vs = JSON.stringify(variant);

  const scriptLines = [
    `const { CAREER } = require('./lib/career-data.ts');`,
    `const d = {`,
    `  subtitle: CAREER.subtitle[${vs}],`,
    `  summary: typeof CAREER.summary[${vs}] === 'function' ? CAREER.summary[${vs}](9) : CAREER.summary[${vs}],`,
    `  skills: CAREER.skills[${vs}],`,
    `  education: [`,
    `    { degree: 'Bachelor of Science in Computer Engineering', school: 'Universidade Federal de Itajuba - UNIFEI', location: 'Itabira, Brazil', years: '2011 - 2018' },`,
    `    { degree: 'Exchange Student, Electrical and Computer Engineering', school: 'University of Toronto', location: 'Toronto, Canada', years: '2013 - 2018' },`,
    `  ],`,
    `  jobs: CAREER.jobOrder[${vs}]`,
    `    .map(function(id) { return CAREER.jobs.find(function(j) { return j.id === id; }); })`,
    `    .filter(function(j) { return j != null; })`,
    `    .map(function(j) { return ({`,
    `      id: j.id,`,
    `      company: j.company,`,
    `      location: j.location,`,
    `      periods: j.periods.map(function(p) { return ({`,
    `        role: p.role,`,
    `        start: p.start,`,
    `        end: p.end,`,
    `        bullets: p.bullets[${vs}] || p.bullets['default'] || [],`,
    `      }); }),`,
    `    }); }),`,
    `};`,
    `console.log(JSON.stringify(d));`,
  ];

  const script = scriptLines.join('\n');
  writeFileSync(tmp, script, 'utf-8');
  const out = execSync(`npx tsx ${tmp}`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    cwd: CONFIG.PORTFOLIO_DIR,
  });
  try { unlink(tmp); } catch {}
  return JSON.parse(out.trim());
}

/**
 * Build the JSON object that the Typst resume template expects.
 */
function buildTypstData(data, override) {
  const subtitle = override.subtitle || data.subtitle;
  const summary = override.summary || data.summary;
  const jobs = applyBulletOverrides(data.jobs, override.bullets);

  return {
    name: 'Fabricio Tramontano Pirini',
    subtitle,
    location: 'Brazil (UTC -3)',
    contact: [
      { href: 'mailto:fabricio@fabriciopirini.com', text: 'fabricio@fabriciopirini.com', icon: 'mail' },
      { href: 'https://fabriciopirini.com', text: 'fabriciopirini.com', icon: 'globe' },
      { href: 'https://linkedin.com/in/fabriciopirini', text: 'fabriciopirini', icon: 'linkedin' },
      { href: 'https://github.com/fabriciopirini', text: 'fabriciopirini', icon: 'github' },
    ],
    summary,
    skills: data.skills,
    jobs,
    education: data.education,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

function applyBulletOverrides(jobs, o) {
  if (!o) return jobs;
  return jobs.map(j => {
    const jo = o[j.id];
    if (!jo) return j;
    return {
      ...j,
      periods: j.periods.map((p, pi) => {
        const po = jo[String(pi)];
        return po ? { ...p, bullets: [...po] } : p;
      }),
    };
  });
}

/**
 * Resume data schema for validation
 */
const RESUME_SCHEMA = {
  name: 'string',
  subtitle: 'string',
  location: 'string',
  contact: 'array',
  summary: 'string',
  skills: 'array',
  jobs: 'array',
  education: 'array',
  date: 'string',
};

async function main() {
  const args = process.argv.slice(2);
  let output = null;
  let variant = 'default';
  let overridePath = null;
  let watch = false;
  let dryRun = false;
  let validateOnly = false;

  for (const a of args) {
    if (a.startsWith('--variant=')) { variant = a.split('=')[1]; continue; }
    if (a.startsWith('--override=')) { overridePath = resolve(process.cwd(), a.split('=')[1]); continue; }
    if (a === '--watch') { watch = true; continue; }
    if (a === '--dry-run') { dryRun = true; continue; }
    if (a === '--validate') { validateOnly = true; continue; }
    if (!a.startsWith('--') && !output) { output = resolve(process.cwd(), a); }
  }

  if (!output) {
    console.error(`
Usage: node scripts/generate-resume.mjs <output.pdf> [options]

Options:
  --variant=default|growth|product   Portfolio variant (default: default)
  --override=<path>                  Override JSON for subtitle/summary/bullets
  --watch                            Watch mode: auto-recompile on changes
  --dry-run                          Show data preview, skip compilation
  --validate                         Validate data structure, skip compilation
`);
    process.exit(1);
  }

  // Validate variant
  try {
    validateVariant(variant);
  } catch (e) {
    log.e(e.message);
    process.exit(1);
  }

  // Import data
  log.i(`Importing variant '${variant}'...`);
  const data = importData(variant);
  log.i(`Subtitle: "${data.subtitle}"`);
  log.i(`Summary: ${(data.summary || '').substring(0, 80)}...`);
  log.i(`Skills: ${(data.skills || []).length}, Jobs: ${(data.jobs || []).length}`);

  // Parse override
  let override = {};
  if (overridePath) {
    if (!existsSync(overridePath)) {
      log.e(`Override file not found: ${overridePath}`);
      process.exit(1);
    }
    override = JSON.parse(await readFile(overridePath, 'utf-8'));
    log.i(`Override applied: ${Object.keys(override).join(', ')}`);
  }

  // Build Typst JSON
  const typstData = buildTypstData(data, override);

  // Check for em/en dashes (AI-writing signal) — fail early
  try {
    validateNoDashes(typstData, 'resume');
  } catch (e) {
    log.e(e.message);
    process.exit(1);
  }

  // Validate if requested
  if (validateOnly) {
    log.i('Validating data structure...');
    try {
      validateData(typstData, RESUME_SCHEMA);
      log.s('Data validation passed');
    } catch (e) {
      log.e(e.message);
      process.exit(1);
    }
    return;
  }

  // Show preview if dry-run
  if (dryRun) {
    showDataPreview(typstData);
    return;
  }

  // Write data.json
  log.i('Writing data.json...');
  await writeDataJson(typstData, DATA_FILE);

  // Create output directory
  await mkdir(dirname(output), { recursive: true });

  // Compile with Typst
  const templatePath = resolve(process.cwd(), 'templates/resume.typ');
  log.i(`Template path: ${templatePath}`);
  log.i(`Output path: ${output}`);
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

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});