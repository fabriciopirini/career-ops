#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStatusRegistry, validateTrackerDocument } from './lib/tracker.mjs';

export function verifyPipeline({ applicationsText, statesText, reportExists }) {
  const errors = [];
  let registry;
  try {
    registry = loadStatusRegistry(statesText);
  } catch (cause) {
    errors.push({ code: 'status-registry', lineNumber: null, message: cause.message });
    return { valid: false, errors, rows: [] };
  }

  const validation = validateTrackerDocument(applicationsText, registry);
  errors.push(...validation.errors);
  for (const row of validation.rows) {
    if (row.kind !== 'data' || !row.reportIdentity?.valid) continue;
    const reportPath = row.reportIdentity.path;
    const normalized = reportPath.replaceAll('\\', '/');
    const root = resolve('reports');
    const resolvedPath = resolve(root, normalized.replace(/^reports\//, ''));
    const relativePath = relative(root, resolvedPath);
    if (!normalized.startsWith('reports/') || isAbsolute(relativePath) || relativePath.startsWith('..') || normalized !== reportPath) {
      errors.push({
        code: 'report-path',
        lineNumber: row.lineNumber,
        message: `report path must stay under reports/: ${reportPath}`,
      });
      continue;
    }
    if (typeof reportExists === 'function' && !reportExists(reportPath)) {
      errors.push({
        code: 'missing-report',
        lineNumber: row.lineNumber,
        message: `report file does not exist: ${reportPath}`,
      });
    }
  }
  return { valid: errors.length === 0, errors, rows: validation.rows };
}

function isDirectInvocation() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectInvocation()) {
  const root = fileURLToPath(new URL('.', import.meta.url));
  const applicationsPath = join(root, 'data', 'applications.md');
  const statesPath = join(root, 'templates', 'states.yml');
  const result = verifyPipeline({
    applicationsText: readFileSync(applicationsPath, 'utf8'),
    statesText: readFileSync(statesPath, 'utf8'),
    reportExists: (reportPath) => {
      const reportRoot = resolve(root, 'reports');
      const candidate = resolve(root, reportPath);
      const relativePath = relative(reportRoot, candidate);
      return !isAbsolute(relativePath) && !relativePath.startsWith('..') && existsSync(candidate);
    },
  });

  if (result.valid) {
    const dataRows = result.rows.filter((row) => row.kind === 'data').length;
    console.log(`Tracker verification passed: ${dataRows} data rows, ${result.rows.length} total lines.`);
  } else {
    console.error(`Tracker verification failed with ${result.errors.length} error(s):`);
    for (const failure of result.errors) {
      const location = failure.lineNumber === null ? '' : `data/applications.md:${failure.lineNumber}: `;
      console.error(`- ${location}${failure.message}`);
    }
    process.exitCode = 1;
  }
}
