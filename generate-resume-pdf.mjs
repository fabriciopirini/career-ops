#!/usr/bin/env node

/**
 * generate-resume-typst.mjs — Generate resume PDF via Typst
 *
 * Reads career data from portfolio (via tsx), applies overrides,
 * writes JSON, shells out to typst compile. No react-pdf, no Playwright.
 *
 * Usage:
 *   node generate-resume-typst.mjs <output.pdf> [--variant default|growth|product] [--override <override.json>]
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

import { readFile, mkdir, writeFile, rm } from 'fs/promises';
import { writeFileSync, unlinkSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_DIR = resolve(__dirname, '../portfolio');
const TYPST_BIN = resolve(os.homedir(), '.typst/bin/typst');
const TYPST_TEMPLATE = resolve(__dirname, 'templates/resume.typ');
const FONT_PATH = resolve(__dirname, 'lib/fonts');

function log(l, m) {
  const t = new Date().toISOString().split('T')[1].split('.')[0];
  const p = { i: '📋', s: '✅', w: '⚠️', e: '❌' };
  console.log(`${p[l] || 'ℹ️'} [${t}] ${m}`);
}

/**
 * Import career data from portfolio via tsx.
 * Writes a temp .cjs script that tsx can import, runs it, parses JSON.
 * Same approach as generate-resume-pdf.mjs.
 */
function importData(variant) {
  const tmp = resolve(PORTFOLIO_DIR, '.tmp-extract.cjs');
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
    cwd: PORTFOLIO_DIR,
  });
  try { unlinkSync(tmp); } catch {}
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

async function main() {
  const args = process.argv.slice(2);
  let output = null;
  let variant = 'default';
  let overridePath = null;

  for (const a of args) {
    if (a.startsWith('--variant=')) { variant = a.split('=')[1]; continue; }
    if (a.startsWith('--override=')) { overridePath = resolve(__dirname, a.split('=')[1]); continue; }
    if (!a.startsWith('--') && !output) { output = resolve(__dirname, a); }
  }

  if (!output) {
    console.error(`
Usage: node generate-resume-typst.mjs <output.pdf> [options]

Options:
  --variant=default|growth|product   Portfolio variant (default: default)
  --override=<path>                  Override JSON for subtitle/summary/bullets
`);
    process.exit(1);
  }

  // Import data
  log('i', `Importing variant '${variant}'...`);
  const data = importData(variant);
  log('i', `Subtitle: "${data.subtitle}"`);
  log('i', `Summary: ${(data.summary || '').substring(0, 80)}...`);
  log('i', `Skills: ${(data.skills || []).length}, Jobs: ${(data.jobs || []).length}`);

  // Parse override
  let override = {};
  if (overridePath) {
    if (!existsSync(overridePath)) {
      log('e', `Override file not found: ${overridePath}`);
      process.exit(1);
    }
    override = JSON.parse(await readFile(overridePath, 'utf-8'));
    log('i', `Override applied: ${Object.keys(override).join(', ')}`);
  }

  // Build Typst JSON
  const typstData = buildTypstData(data, override);
  const dataJsonPath = resolve(__dirname, 'templates/data.json');
  await writeFile(dataJsonPath, JSON.stringify(typstData, null, 2), 'utf-8');

  // Compile with Typst
  await mkdir(dirname(output), { recursive: true });
  log('i', `Compiling with Typst: ${output}...`);

  try {
    execSync(
      `${TYPST_BIN} compile --font-path ${FONT_PATH} ${TYPST_TEMPLATE} ${output}`,
      { stdio: 'inherit', cwd: __dirname },
    );
  } catch (e) {
    log('e', 'Typst compilation failed');
    log('i', `Data JSON preserved at: ${dataJsonPath}`);
    process.exit(1);
  }

  // Clean up
  await rm(dataJsonPath, { force: true });

  const stats = statSync(output);
  log('s', `PDF: ${output} (${(stats.size / 1024).toFixed(1)} KB)`);
  process.stdout.write(output + '\n');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
