import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadStatusRegistry, parseTrackerRow, serializeTrackerRow, validateTrackerDocument, extractReportIdentity } from '../lib/tracker.mjs';

const statesText = readFileSync(new URL('../templates/states.yml', import.meta.url), 'utf8');
const registry = loadStatusRegistry(statesText);
const row = '| 1 | 2026-07-21 | Acme | Senior Engineer | 4.2/5 | Evaluated | ❌ | [1](reports/1-acme.md) | Notes: $120K; https://example.test/jobs/1 |';

function documentFor(dataRows) {
  return ['# Applications Tracker', '| # | Date | Company | Role | Score | Status | PDF | Report | Notes |', '|---|------|---------|------|-------|--------|-----|--------|-------|', ...dataRows].join('\n');
}

test('parses and serializes a canonical row', () => {
  const parsed = parseTrackerRow(row, 4);
  assert.equal(parsed.kind, 'data');
  assert.equal(parsed.lineNumber, 4);
  assert.equal(parsed.number, 1);
  assert.deepEqual(parsed.fields, {
    number: '1', date: '2026-07-21', company: 'Acme', role: 'Senior Engineer', score: '4.2/5',
    status: 'Evaluated', pdf: '❌', report: '[1](reports/1-acme.md)', notes: 'Notes: $120K; https://example.test/jobs/1',
  });
  assert.equal(parsed.validationErrors.length, 0);
  assert.equal(serializeTrackerRow(parsed), row);
});

test('accepts every canonical status from registry', () => {
  for (const [index, status] of registry.labels.entries()) {
    const parsed = validateTrackerDocument(documentFor([
      `| ${index + 1} | 2026-07-21 | Acme | Role | 4/5 | ${status} | ❌ | [${index + 1}](reports/${index + 1}-acme.md) | |`,
    ]), registry);
    assert.equal(parsed.valid, true, status);
  }
});

test('normalizes aliases only in migration mode', () => {
  assert.equal(registry.resolveStatus('EVALUADA', 'strict'), null);
  assert.equal(registry.resolveStatus('EVALUADA', 'migration'), 'Evaluated');
});

test('rejects an unknown status in strict validation', () => {
  const result = validateTrackerDocument(documentFor([row.replace('Evaluated', 'Mystery')]), registry);
  assert.equal(result.valid, false);
  assert.match(result.errors[0].message, /unknown or non-canonical status/);
});

test('rejects duplicate entry numbers', () => {
  const result = validateTrackerDocument(documentFor([row, row.replace('Acme', 'Other')]), registry);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-entry-number'));
});

test('rejects duplicate report numbers', () => {
  const duplicate = row.replace('| 1 |', '| 2 |').replace('Acme', 'Other').replace('[1]', '[1]').replace('/1-', '/1-');
  const result = validateTrackerDocument(documentFor([row, duplicate]), registry);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-report-number'));
});

test('rejects mismatched report label and filename number', () => {
  const result = validateTrackerDocument(documentFor([row.replace('[1](reports/1-', '[2](reports/1-')]), registry);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'report-identity'));
});

test('rejects missing fields', () => {
  const malformed = '| 1 | 2026-07-21 | Acme | Role | 4/5 | Evaluated | ❌ |';
  const parsed = parseTrackerRow(malformed, 4);
  assert.equal(parsed.kind, 'data');
  assert.ok(parsed.validationErrors.some((item) => item.code === 'field-count'));
});

test('rejects extra structural fields and pipes', () => {
  const malformed = `${row.slice(0, -1)} | extra |`;
  const parsed = parseTrackerRow(malformed, 4);
  assert.ok(parsed.validationErrors.some((item) => item.code === 'field-count'));
});

test('preserves header and separator rows', () => {
  const header = parseTrackerRow('| # | Date | Company | Role | Score | Status | PDF | Report | Notes |', 1);
  const separator = parseTrackerRow('|---|------|---------|------|-------|--------|-----|--------|-------|', 2);
  assert.equal(header.kind, 'header');
  assert.equal(separator.kind, 'separator');
  assert.equal(header.original, '| # | Date | Company | Role | Score | Status | PDF | Report | Notes |');
});

test('accepts ordinary punctuation and URLs in notes', () => {
  const result = validateTrackerDocument(documentFor([row]), registry);
  assert.equal(result.valid, true);
  assert.match(result.rows[3].fields.notes, /https:\/\/example\.test/);
});

test('rejects tabs in fields', () => {
  const parsed = parseTrackerRow(row.replace('Acme', 'Acme\tLabs'), 4);
  assert.ok(parsed.validationErrors.some((item) => item.code === 'control-character'));
});

test('rejects terminal control characters in fields', () => {
  const parsed = parseTrackerRow(row.replace('Acme', `Acme${String.fromCharCode(7)}Labs`), 4);
  assert.ok(parsed.validationErrors.some((item) => item.code === 'control-character'));
});

test('rejects embedded newlines when parsing one row', () => {
  const parsed = parseTrackerRow(row.replace('Acme', 'Acme\nLabs'), 4);
  assert.ok(parsed.validationErrors.some((item) => item.code === 'control-character'));
});

test('rejects non-positive and non-integer entry numbers', () => {
  for (const value of ['0', '-1', 'one']) {
    const parsed = parseTrackerRow(row.replace('| 1 |', `| ${value} |`), 4);
    assert.ok(parsed.validationErrors.some((item) => item.code === 'entry-number'), value);
  }
});

test('extracts report identity and allows an empty cell', () => {
  assert.deepEqual(extractReportIdentity('[007](reports/007-acme.md)'), {
    valid: true, raw: '[007](reports/007-acme.md)', labelNumber: 7, filenameNumber: 7, label: 7, path: 'reports/007-acme.md',
  });
  assert.equal(extractReportIdentity(''), null);
  assert.equal(extractReportIdentity('-').valid, false);
});

test('rejects duplicate labels and aliases in status registry', () => {
  assert.throws(() => loadStatusRegistry('states:\n  - label: A\n    aliases: [x]\n  - label: a\n    aliases: []'), /Duplicate/);
  assert.throws(() => loadStatusRegistry('states:\n  - label: A\n    aliases: [x, X]'), /Duplicate/);
});

test('aggregates malformed rows rather than stopping at first error', () => {
  const malformed = documentFor([
    row.replace('Evaluated', 'Mystery'),
    row.replace('| 1 |', '| 2 |').replace('[1]', '[3]').replace('Acme', 'Other'),
    '| 3 | 2026-07-21 | Broken | Role | 4/5 | Evaluated | ❌ | - | |',
  ]);
  const result = validateTrackerDocument(malformed, registry);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 3);
  assert.ok(result.errors.some((item) => item.code === 'status'));
  assert.ok(result.errors.some((item) => item.code === 'report-identity'));
  assert.ok(result.errors.some((item) => item.code === 'report-format'));
});
