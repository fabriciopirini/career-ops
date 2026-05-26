#!/usr/bin/env node

/**
 * generate-portfolio-pdf.mjs — Generate resume PDF from portfolio with variant switching
 *
 * This script:
 * 1. Temporarily switches ACTIVE_VARIANT in site-config.ts based on job archetype
 * 2. Generates PDF using Playwright (requires Next.js dev server running)
 * 3. Leaves changes in place for iteration (restore manually when satisfied)
 *
 * Usage:
 *   node generate-portfolio-pdf.mjs <output-pdf> [--variant <default|growth|product>]
 *
 * Options:
 *   --variant <name>  Force specific variant (default: auto-detect from evaluation)
 *   --port <number>   Next.js port (default: 3000)
 *
 * To restore original state when done:
 *   cd ../portfolio && git checkout -- lib/site-config.ts
 *
 * Variants:
 *   default  — Design Engineer positioning
 *   growth   — Growth & Experimentation positioning
 *   product  — Product Engineer positioning
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// CONFIGURATION
// ============================================================

const CAREER_OPS_DIR = resolve(__dirname);
const PORTFOLIO_DIR = resolve(__dirname, '../portfolio');
const SITE_CONFIG_PATH = resolve(PORTFOLIO_DIR, 'lib/site-config.ts');
const NEXT_PORT = 3000;

// Archetype to variant mapping
const ARCHETYPE_TO_VARIANT = {
  'AI Platform / LLMOps': 'default',
  'Agentic / Automation': 'growth',
  'Technical AI PM': 'product',
  'AI Solutions Architect': 'default',
  'AI Forward Deployed': 'growth',
  'AI Transformation': 'product',
  'Full Stack': 'default',
  'Full Stack Engineer': 'default',
  'Full Stack Engineer (DevTools/Infrastructure)': 'default',
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function log(level, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { info: '📋', success: '✅', warn: '⚠️', error: '❌' };
  console.log(`${prefix[level] || 'ℹ️'} [${timestamp}] ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// VARIANT OPERATIONS
// ============================================================

async function readOriginalVariant() {
  const content = await readFile(SITE_CONFIG_PATH, 'utf-8');
  const match = content.match(/export const ACTIVE_VARIANT:\s*SiteVariant\s*=\s*'([^']+)'/);
  return match ? match[1] : 'default';
}

async function setVariant(variant) {
  const content = await readFile(SITE_CONFIG_PATH, 'utf-8');
  const newContent = content.replace(
    /(export const ACTIVE_VARIANT:\s*SiteVariant\s*=\s*)'[^']+'/,
    `$1'${variant}'`
  );
  await writeFile(SITE_CONFIG_PATH, newContent, 'utf-8');
  log('info', `Set ACTIVE_VARIANT to '${variant}'`);
}

// ============================================================
// EVALUATION REPORT PARSING
// ============================================================

function parseEvaluationReport(reportPath) {
  if (!existsSync(reportPath)) {
    return null;
  }
  
  const reportContent = readFileSync(reportPath, 'utf-8');
  
  const archetypeMatch = reportContent.match(/\*\*Archetype:\*\*\s*(.+)/);
  const detectedArchetype = archetypeMatch ? archetypeMatch[1].trim() : null;
  
  const suggestedVariant = detectedArchetype 
    ? (ARCHETYPE_TO_VARIANT[detectedArchetype] || 'default')
    : 'default';
  
  return {
    detectedArchetype,
    suggestedVariant,
  };
}

// ============================================================
// PDF GENERATION
// ============================================================

async function generatePDF(outputPath, port = NEXT_PORT) {
  log('info', `Generating PDF from http://localhost:${port}/resume`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--font-render-hinting=none'],
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2,
    });
    
    const page = await context.newPage();
    await page.emulateMedia({ media: 'print' });
    
    const resumeUrl = `http://localhost:${port}/resume`;
    log('info', `Navigating to: ${resumeUrl}`);
    
    // Give Next.js time to rebuild after config change
    await sleep(2000);
    
    await page.goto(resumeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await sleep(1000);
    
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const outputDir = dirname(outputPath);
    const { mkdir } = await import('fs/promises');
    await mkdir(outputDir, { recursive: true });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: false,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9pt; color: #6b7280; padding: 0 2cm; display: flex; justify-content: space-between; font-family: 'Source Sans 3', sans-serif;">
          <span>${date}</span>
          <span>Fabricio Tramontano Pirini • Resume</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `,
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
    });
    
    await browser.close();
    
    const { statSync } = await import('fs');
    const stats = statSync(outputPath);
    log('success', `✨ PDF generated: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    
    return { outputPath, size: stats.size };
  } catch (err) {
    await browser.close();
    throw new Error(`PDF generation failed: ${err.message}`);
  }
}

// ============================================================
// MAIN WORKFLOW
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  let outputPath = null;
  let variant = null;
  let port = NEXT_PORT;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--variant' && args[i + 1]) {
      variant = args[++i];
    } else if (arg === '--port' && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if (!arg.startsWith('--') && !outputPath) {
      outputPath = resolve(CAREER_OPS_DIR, arg);
    } else if (arg.startsWith('--')) {
      log('error', `Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  
  if (!outputPath) {
    outputPath = resolve(CAREER_OPS_DIR, 'output/portfolio-resume.pdf');
    log('info', `Output path not specified, using: ${outputPath}`);
  }
  
  log('info', `=== Portfolio Resume PDF Generation ===`);
  log('info', `Output: ${outputPath}`);
  log('info', `Next.js port: ${port}`);
  
  if (!existsSync(SITE_CONFIG_PATH)) {
    log('error', `Site config not found: ${SITE_CONFIG_PATH}`);
    process.exit(1);
  }
  
  const originalVariant = await readOriginalVariant();
  log('info', `Current variant: ${originalVariant}`);
  
  try {
    // Step 1: Determine target variant
    log('info', `Step 1: Determining target variant...`);
    
    let targetVariant = variant;
    
    if (!targetVariant) {
      const { readdirSync } = await import('fs');
      const reportsDir = resolve(CAREER_OPS_DIR, 'reports');
      
      if (existsSync(reportsDir)) {
        const reports = readdirSync(reportsDir)
          .filter(f => f.endsWith('.md'))
          .sort()
          .reverse();
        
        if (reports.length > 0) {
          const latestReport = resolve(reportsDir, reports[0]);
          const evaluation = parseEvaluationReport(latestReport);
          if (evaluation) {
            targetVariant = evaluation.suggestedVariant;
            log('info', `Auto-detected from ${reports[0]}: ${evaluation.detectedArchetype} → '${targetVariant}'`);
          }
        }
      }
    }
    
    if (!targetVariant) {
      targetVariant = 'default';
      log('warn', `Could not auto-detect variant, using 'default'`);
    }
    
    if (targetVariant !== originalVariant) {
      log('info', `Switching variant: ${originalVariant} → ${targetVariant}`);
    } else {
      log('info', `Variant already set to '${targetVariant}'`);
    }
    
    // Step 2: Apply variant
    if (targetVariant !== originalVariant) {
      log('info', `Step 2: Applying variant...`);
      await setVariant(targetVariant);
      log('warn', `⏳ Waiting for Next.js to rebuild...`);
      await sleep(3000);
    } else {
      log('info', `Step 2: Skipped (no change needed)`);
    }
    
    // Step 3: Generate PDF
    log('info', `Step 3: Generating PDF...`);
    log('warn', `Make sure Next.js dev server is running: cd ${PORTFOLIO_DIR} && bun run dev`);
    
    try {
      const response = await fetch(`http://localhost:${port}/resume`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err) {
      log('error', `Next.js dev server not responding on port ${port}`);
      log('error', `Start it with: cd ${PORTFOLIO_DIR} && bun run dev`);
      throw err;
    }
    
    const pdfResult = await generatePDF(outputPath, port);
    
    // Step 4: Print restoration instructions
    console.log('');
    log('success', `🎉 Complete! PDF saved to: ${pdfResult.outputPath}`);
    console.log('');
    
    if (targetVariant !== originalVariant) {
      log('info', `Changes are staged in ${PORTFOLIO_DIR}/lib/site-config.ts`);
      log('info', `To restore original variant when satisfied:`);
      console.log('');
      console.log(`  cd ${PORTFOLIO_DIR} && git checkout -- lib/site-config.ts`);
      console.log('');
      log('warn', `⚠️  Don't forget to restore before committing to portfolio!`);
    } else {
      log('info', `No changes to restore (variant was already '${originalVariant}')`);
    }
    
  } catch (err) {
    log('error', `Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});