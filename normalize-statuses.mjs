#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadStatusRegistry,
  parseTrackerRow,
  serializeTrackerRow,
  validateTrackerDocument,
} from './lib/tracker.mjs';

const CAREER_OPS = fileURLToPath(new URL('.', import.meta.url));
const APPS_FILE = existsSync(join(CAREER_OPS, 'data', 'applications.md'))
  ? join(CAREER_OPS, 'data', 'applications.md')
  : join(CAREER_OPS, 'applications.md');
const STATES_FILE = join(CAREER_OPS, 'templates', 'states.yml');

function migrationAlias(rawStatus) {
  const clean = String(rawStatus ?? '').replace(/\*\*/g, '').trim();
  if (/^duplicado/i.test(clean)) return 'duplicado';
  if (/^dup\b/i.test(clean)) return 'dup';
  if (/^repost/i.test(clean)) return 'repost';
  if (/geo.?blocker/i.test(clean)) return 'geo-blocker';
  return clean;
}

export function normalizeStatus(rawStatus, statusRegistry) {
  const raw = String(rawStatus ?? '');
  const clean = raw.replace(/\*\*/g, '').trim();
  const withoutDate = clean.replace(/\s+\d{4}(?:-\d{2}-\d{2})?.*$/, '').trim();
  const alias = migrationAlias(withoutDate);
  const migrated = statusRegistry.resolveStatus(alias, 'migration');
  if (migrated) {
    const moveToNotes = /^(duplicado|dup|repost)\b/i.test(clean) ? raw.trim() : undefined;
    return { status: migrated, ...(moveToNotes ? { moveToNotes } : {}) };
  }
  return { status: null, unknown: true };
}

export function normalizeDocument(content, statesText) {
  const registry = loadStatusRegistry(statesText);
  const lines = String(content).split('\n');
  const output = [...lines];
  const errors = [];
  let changes = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const row = parseTrackerRow(lines[index].replace(/\r$/, ''), index + 1);
    if (row.kind !== 'data') continue;
    if (row.validationErrors.length > 0) {
      errors.push(...row.validationErrors);
      continue;
    }

    const result = normalizeStatus(row.fields.status, registry);
    if (result.unknown) {
      errors.push({
        code: 'status',
        lineNumber: row.lineNumber,
        message: `unknown status cannot be normalized: ${row.fields.status}`,
      });
      continue;
    }
    if (result.status === row.fields.status && !result.moveToNotes) continue;

    row.fields.status = result.status;
    if (result.moveToNotes && !row.fields.notes.includes(result.moveToNotes)) {
      row.fields.notes = result.moveToNotes + (row.fields.notes ? `. ${row.fields.notes}` : '');
    }
    row.fields.score = row.fields.score.replace(/\*\*/g, '');
    output[index] = serializeTrackerRow(row);
    changes += 1;
  }

  const transformed = output.join('\n');
  const validation = validateTrackerDocument(transformed, registry);
  const recordedFailures = new Set(
    errors.map((item) => `${item.code}:${item.lineNumber}`),
  );
  for (const item of validation.errors) {
    if (recordedFailures.has(`${item.code}:${item.lineNumber}`)) continue;
    errors.push(item);
  }
  const valid = errors.length === 0;
  return {
    content: valid ? transformed : String(content),
    changes: valid ? changes : 0,
    errors,
    valid,
    registry,
  };
}

function main() {
  if (!existsSync(APPS_FILE)) {
    console.log('No applications.md found. Nothing to normalize.');
    return 0;
  }
  const dryRun = process.argv.includes('--dry-run');
  const content = readFileSync(APPS_FILE, 'utf8');
  const statesText = readFileSync(STATES_FILE, 'utf8');
  const result = normalizeDocument(content, statesText);

  if (!result.valid) {
    console.error(`Normalization aborted with ${result.errors.length} error(s); no files written.`);
    for (const failure of result.errors) {
      console.error(`- applications.md:${failure.lineNumber}: ${failure.message}`);
    }
    return 1;
  }

  console.log(`\n${result.changes} statuses normalized`);
  if (dryRun) {
    console.log('(dry-run — no changes written)');
    return 0;
  }
  if (result.changes === 0) {
    console.log('No changes needed');
    return 0;
  }
  copyFileSync(APPS_FILE, `${APPS_FILE}.bak`);
  writeFileSync(APPS_FILE, result.content);
  console.log('Written to applications.md (backup: applications.md.bak)');
  return 0;
}

const invokedPath = process.argv[1] && fileURLToPath(new URL(process.argv[1], 'file:'));
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
