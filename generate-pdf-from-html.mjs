#!/usr/bin/env node

/**
 * generate-pdf-from-html.mjs — Simple HTML → PDF via Playwright
 *
 * Usage:
 *   node generate-pdf-from-html.mjs <input.html> <output.pdf> [--format=a4|letter]
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

async function main() {
  const args = process.argv.slice(2);
  let inputPath, outputPath, format = 'a4';

  for (const arg of args) {
    if (arg.startsWith('--format=')) format = arg.split('=')[1];
    else if (!inputPath) inputPath = arg;
    else if (!outputPath) outputPath = arg;
  }

  if (!inputPath || !outputPath) {
    console.error('Usage: node generate-pdf-from-html.mjs <input.html> <output.pdf> [--format=a4|letter]');
    process.exit(1);
  }

  inputPath = resolve(inputPath);
  outputPath = resolve(outputPath);

  if (!existsSync(inputPath)) {
    console.error('Input not found:', inputPath);
    process.exit(1);
  }

  let html = await readFile(inputPath, 'utf-8');

  const browser = await chromium.launch({
    headless: true,
    args: ['--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle',
      baseURL: `file://${dirname(inputPath)}/`,
    });

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const outputDir = dirname(outputPath);
    const { mkdir } = await import('fs/promises');
    await mkdir(outputDir, { recursive: true });

    await page.pdf({
      path: outputPath,
      format: format,
      printBackground: true,
      margin: { top: '0.2in', right: '0.2in', bottom: '0.2in', left: '0.2in' },
    });

    const { statSync } = await import('fs');
    const stats = statSync(outputPath);
    console.log(`✅ PDF: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});