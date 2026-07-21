import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPipeline } from '../verify-pipeline.mjs';
import { normalizeDocument } from '../normalize-statuses.mjs';

const statesText = `states:
  - id: evaluated
    label: Evaluated
    aliases: [evaluada]
  - id: applied
    label: Applied
    aliases: [aplicado]
`;
const header = '# Applications Tracker\n| # | Date | Company | Role | Score | Status | PDF | Report | Notes |\n|---|------|---------|------|-------|--------|-----|--------|-------|';
const validRow = '| 1 | 2026-07-21 | Acme | Role | 4/5 | Evaluated | ❌ | [1](reports/1-acme.md) | |';
const validText = `${header}\n${validRow}`;

function run(applicationsText, overrides = {}) {
  return verifyPipeline({
    applicationsText,
    statesText,
    reportExists: () => true,
    ...overrides,
  });
}

test('verifies valid tracker input through injected seam', () => {
  const result = run(validText);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('reports missing report without mutating input', () => {
  const result = run(validText, { reportExists: () => false });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-report'));
  assert.equal(validText, `${header}\n${validRow}`);
});

test('reports mismatched report identity', () => {
  const result = run(validText.replace('[1](reports/1-', '[2](reports/1-'));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'report-identity'));
});

test('reports duplicate entry IDs', () => {
  const second = validRow.replace('Acme', 'Other').replace('[1]', '[2]').replace('/1-', '/2-');
  const result = run(`${header}\n${validRow}\n${second.replace('| 1 |', '| 1 |')}`);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-entry-number'));
});

test('reports unknown statuses', () => {
  const result = run(validText.replace('Evaluated', 'Unknown'));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'status'));
});

test('reports all known current-style violations together', () => {
  const malformed = `${header}\n${validRow.replace('[1](reports/1-', 'Pending - confirm Brazil remote eligibility')}
| 2 | 2026-07-21 | Other | Role | 4/5 | Evaluated | ❌ | - | |`;
  const result = run(malformed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'report-format'));
  assert.ok(result.errors.some((item) => item.code === 'report-format' && item.lineNumber === 5));
});

test('rejects report paths outside reports directory', () => {
  const result = run(validText.replace('reports/1-', '../secret/1-'));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'report-path'));
});

test('normalizer aborts on malformed rows and returns unchanged content', () => {
  const malformed = `${header}\n${validRow.replace('Evaluated', 'evaluada').replace('[1](reports/1-acme.md)', 'Pending - confirm Brazil remote eligibility')}`;
  const result = normalizeDocument(malformed, statesText);
  assert.equal(result.valid, false);
  assert.equal(result.content, malformed);
  assert.ok(result.errors.some((item) => item.code === 'report-format'));
});

test('normalizer converts declared aliases only in candidate output', () => {
  const alias = validText.replace('Evaluated', 'evaluada');
  const result = normalizeDocument(alias, statesText);
  assert.equal(result.valid, true);
  assert.equal(result.changes, 1);
  assert.match(result.content, /\| Evaluated \|/);
  assert.match(alias, /\| evaluada \|/);
});

test('normalizer leaves unknown status unchanged and reports it once', () => {
  const unknown = validText.replace('Evaluated', 'mystery');
  const result = normalizeDocument(unknown, statesText);
  assert.equal(result.valid, false);
  assert.equal(result.content, unknown);
  assert.equal(result.changes, 0);
  assert.equal(result.errors.filter((item) => item.code === 'status' && item.lineNumber === 4).length, 1);
});

test('normalizer deduplicates malformed row validation without mutation', () => {
  const malformed = `${validRow.slice(0, -1)} | extra |`;
  const result = normalizeDocument(`${header}\n${malformed}`, statesText);
  assert.equal(result.valid, false);
  assert.equal(result.content, `${header}\n${malformed}`);
  assert.equal(result.changes, 0);
  assert.equal(result.errors.filter((item) => item.code === 'field-count' && item.lineNumber === 4).length, 1);
});
