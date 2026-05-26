#!/usr/bin/env node

/**
 * normalize-typography.mjs — Normalize typography for ATS compatibility
 *
 * Reads stdin, writes normalized to stdout.
 *
 * Usage:
 *   node normalize-typography.mjs < input.txt > output.txt
 *   echo 'text' | node normalize-typography.mjs
 */

function normalize(text) {
  return text
    .replace(/\u2014/g, '-')           // em dash
    .replace(/\u2013/g, '-')           // en dash
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes
    .replace(/[\u2018\u2019]/g, "'")   // smart single quotes
    .replace(/\u2026/g, '...')         // ellipsis
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/\u00A0/g, ' ')           // non-breaking space
    .replace(/\u2022/g, '-')           // bullet
    .replace(/\u2033/g, '"')           // double prime
    .replace(/\u2032/g, "'");          // prime
}

if (process.stdin.isTTY) {
  // Called with argument
  const input = process.argv[2] || '';
  process.stdout.write(normalize(input));
} else {
  // Read from stdin
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => process.stdout.write(normalize(data)));
}

export { normalize };