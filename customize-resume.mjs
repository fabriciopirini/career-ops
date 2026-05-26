#!/usr/bin/env node

/**
 * customize-resume.mjs — Apply resume customizations from evaluation report
 *
 * This script:
 * 1. Parses the evaluation report for the customization plan
 * 2. Applies changes to career-data.ts based on the plan
 * 3. Generates PDF with the customized content
 *
 * Usage:
 *   node customize-resume.mjs <report-path> <output-pdf>
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAREER_OPS_DIR = resolve(__dirname);
const PORTFOLIO_DIR = resolve(__dirname, '../portfolio');
const CAREER_DATA_PATH = resolve(PORTFOLIO_DIR, 'lib/career-data.ts');
const SITE_CONFIG_PATH = resolve(PORTFOLIO_DIR, 'lib/site-config.ts');

function log(level, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { info: '📋', success: '✅', warn: '⚠️', error: '❌' };
  console.log(`${prefix[level] || 'ℹ️'} [${timestamp}] ${message}`);
}

// ============================================================
// PARSING CUSTOMIZATION PLAN
// ============================================================

function parseCustomizationPlan(reportPath) {
  const reportContent = readFileSync(reportPath, 'utf-8');
  
  // Find the customization table
  const tableMatch = reportContent.match(/## E\) Customization Plan\s+(.+?)(?=\n##|$)/s);
  if (!tableMatch) {
    log('error', 'Could not find customization plan in report');
    return [];
  }
  
  const tableText = tableMatch[1];
  const rows = tableText.match(/^\|\s*\d+\s*\|.+?$/gm) || [];
  
  return rows.map(row => {
    const parts = row.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 4) {
      return {
        section: parts[0],
        current: parts[1],
        proposed: parts[2],
        reason: parts[3],
      };
    }
    return null;
  }).filter(Boolean);
}

// ============================================================
// APPLYING CUSTOMIZATIONS
// ============================================================

async function applyCustomizations(customizations) {
  let content = await readFile(CAREER_DATA_PATH, 'utf-8');
  let modified = false;

  for (const item of customizations) {
    log('info', `Applying: ${item.section} - ${item.reason}`);

    switch (item.section) {
      case '1':
      case 'Summary':
        // Update the default summary
        const newSummary = `Full stack engineer who builds developer-facing tools and works directly with customers. Nearly 9 years in React and TypeScript across web and mobile. Currently at Payward (Kraken), owning design systems and shipping to 4 platforms, including a React Native support portal built from scratch. Built the first A/B experimentation program at Oda (2-4 experiments/month), led teams at Norwegian scale-ups, and built component libraries used by 3 teams.`;
        content = content.replace(
          /(summary:\s*\{\s*default:\s*\(years\)\s*=>\s*)`[^`]+`/,
          `$1\`${newSummary}\``
        );
        modified = true;
        break;

      case '2':
      case 'Payward bullets':
        // Add emphasis on React Native portal - full stack capability
        content = content.replace(
          "'Shipped an in-app support portal to 3 React Native apps from scratch. Built tier-aware contact options, VIP manager card, and live support queue visibility. Coordinated phased rollout across consumer, pay, and pro mobile applications.'",
          "'Built React Native support portal from scratch across 3 mobile apps (consumer, pay, pro) with tier-aware contact options, VIP escalation, and live queue visibility. Designed and shipped end-to-end: frontend, backend integration, and rollout strategy.'"
        );
        modified = true;
        break;

      case '3':
      case 'Norsk Gjenvinning':
        // Emphasize end-to-end full stack ownership
        content = content.replace(
          "'Rebuilt legacy storefronts and built new ones, shipping 5 with React, TypeScript, and Next.js. Worked with everyone from the CEO to junior engineers across design, product, and business.'",
          "'Built 5 storefronts end-to-end with React, TypeScript, and Next.js. Worked directly with the CEO, product, design, and business stakeholders - from requirements to deployment.'"
        );
        modified = true;
        break;

      case '4':
      case 'Skills section':
        // Ensure full stack is called out explicitly
        // This is complex - skip for now
        log('warn', 'Skills section customization requires manual editing - skipping');
        break;

      case '5':
      case 'New bullet':
        // This is complex - skip for now
        log('warn', 'Adding new bullets requires manual editing - skipping');
        break;

      default:
        log('warn', `Unknown section: ${item.section}`);
    }
  }

  if (modified) {
    await writeFile(CAREER_DATA_PATH, content, 'utf-8');
    log('success', 'Customizations applied to career-data.ts');
  } else {
    log('warn', 'No customizations were applied');
  }

  return modified;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    log('error', 'Usage: node customize-resume.mjs <report-path> <output-pdf>');
    process.exit(1);
  }

  const reportPath = resolve(CAREER_OPS_DIR, args[0]);
  const outputPath = resolve(CAREER_OPS_DIR, args[1]);

  if (!existsSync(reportPath)) {
    log('error', `Report not found: ${reportPath}`);
    process.exit(1);
  }

  if (!existsSync(CAREER_DATA_PATH)) {
    log('error', `Career data not found: ${CAREER_DATA_PATH}`);
    process.exit(1);
  }

  log('info', `=== Resume Customization ===`);
  log('info', `Report: ${reportPath}`);
  log('info', `Output: ${outputPath}`);

  // Step 1: Parse customization plan
  log('info', `Step 1: Parsing customization plan...`);
  const customizations = parseCustomizationPlan(reportPath);
  log('info', `Found ${customizations.length} customization items`);

  // Step 2: Apply customizations
  log('info', `Step 2: Applying customizations...`);
  const modified = await applyCustomizations(customizations);

  if (!modified) {
    log('warn', 'No changes made - nothing to generate');
    process.exit(0);
  }

  // Step 3: Generate PDF using the portfolio PDF generator
  log('info', `Step 3: Generating PDF...`);
  const pdfGenPath = resolve(CAREER_OPS_DIR, 'generate-portfolio-pdf.mjs');

  try {
    execSync(`node "${pdfGenPath}" "${outputPath}"`, {
      cwd: CAREER_OPS_DIR,
      stdio: 'inherit',
    });
  } catch (err) {
    log('error', `PDF generation failed: ${err.message}`);
    process.exit(1);
  }

  // Step 4: Print restoration instructions
  console.log('');
  log('success', `🎉 Complete!`);
  console.log('');
  log('info', `Changes are staged in ${PORTFOLIO_DIR}/lib/career-data.ts`);
  log('info', `To restore original state when satisfied:`);
  console.log('');
  console.log(`  cd ${PORTFOLIO_DIR} && git checkout -- lib/career-data.ts`);
  console.log('');
  log('warn', `⚠️  Don't forget to restore before committing to portfolio!`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});