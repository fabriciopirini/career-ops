import yaml from 'js-yaml';

const FIELD_NAMES = Object.freeze([
  'number',
  'date',
  'company',
  'role',
  'score',
  'status',
  'pdf',
  'report',
  'notes',
]);
const CONTROL_CHARACTERS = /[\t\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function cleanStatus(value) {
  return String(value ?? '').trim();
}

function statusKey(value) {
  return cleanStatus(value).toLocaleLowerCase('en-US');
}

function error(code, lineNumber, message, extra = {}) {
  return { code, lineNumber, message, ...extra };
}

export function loadStatusRegistry(yamlText) {
  let document;
  try {
    document = yaml.load(yamlText);
  } catch (cause) {
    throw new Error(`Unable to parse status registry: ${cause.message}`, { cause });
  }

  if (!document || !Array.isArray(document.states)) {
    throw new Error('Unable to parse status registry: states must be an array');
  }

  const labels = [];
  const canonical = new Map();
  const aliases = new Map();
  for (const state of document.states) {
    if (!state || typeof state.label !== 'string' || !state.label.trim()) {
      throw new Error('Unable to parse status registry: every state needs a label');
    }
    const label = state.label.trim();
    const labelKey = statusKey(label);
    if (canonical.has(labelKey) || aliases.has(labelKey)) {
      throw new Error(`Duplicate status label or alias: ${label}`);
    }
    canonical.set(labelKey, label);
    labels.push(label);

    if (state.aliases === undefined) continue;
    if (!Array.isArray(state.aliases)) {
      throw new Error(`Status aliases for ${label} must be an array`);
    }
    for (const alias of state.aliases) {
      if (typeof alias !== 'string' || !alias.trim()) {
        throw new Error(`Status alias for ${label} must be a non-empty string`);
      }
      const aliasKey = statusKey(alias);
      if (canonical.has(aliasKey) || aliases.has(aliasKey)) {
        throw new Error(`Duplicate status label or alias: ${alias}`);
      }
      aliases.set(aliasKey, label);
    }
  }

  const resolveStatus = (raw, mode = 'strict') => {
    const key = statusKey(raw);
    if (canonical.has(key)) return canonical.get(key);
    if (mode === 'migration' && aliases.has(key)) return aliases.get(key);
    return null;
  };

  return Object.freeze({
    labels: Object.freeze(labels),
    aliases: Object.freeze(Object.fromEntries(aliases)),
    resolveStatus,
    resolve: resolveStatus,
  });
}

function classifyLine(line) {
  const trimmed = line.trim();
  if (/^\|\s*#\s*\|/.test(trimmed)) return 'header';
  if (/^\|\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?$/.test(trimmed)) return 'separator';
  return 'other';
}

export function parseTrackerRow(line, lineNumber) {
  const original = String(line);
  const kind = classifyLine(original);
  if (kind !== 'other' || !original.includes('|')) {
    return { kind, original, lineNumber };
  }

  const parts = original.split('|');
  const wrapped = parts[0].trim() === '' && parts.at(-1).trim() === '';
  const cells = wrapped ? parts.slice(1, -1).map((part) => part.trim()) : parts.map((part) => part.trim());
  const validationErrors = [];

  if (!wrapped) {
    validationErrors.push(error('row-delimiters', lineNumber, 'data row must start and end with |'));
  }
  if (cells.length !== FIELD_NAMES.length) {
    validationErrors.push(error(
      'field-count',
      lineNumber,
      `data row must have exactly ${FIELD_NAMES.length} fields (found ${cells.length})`,
    ));
  }
  if (CONTROL_CHARACTERS.test(original) || original.includes('\n') || original.includes('\r')) {
    validationErrors.push(error('control-character', lineNumber, 'data row contains a tab, newline, or terminal control character'));
  }

  const fields = Object.fromEntries(FIELD_NAMES.map((name, index) => [name, cells[index] ?? '']));
  const numberValue = /^\d+$/.test(fields.number) ? Number(fields.number) : NaN;
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    validationErrors.push(error('entry-number', lineNumber, 'entry number must be a positive integer'));
  }

  return {
    kind: 'data',
    original,
    lineNumber,
    fields,
    number: Number.isSafeInteger(numberValue) ? numberValue : null,
    validationErrors,
  };
}

export function serializeTrackerRow(row) {
  const fields = row.fields ?? row;
  return `| ${FIELD_NAMES.map((name) => String(fields[name] ?? '').trim()).join(' | ')} |`;
}

export function extractReportIdentity(reportCell) {
  const raw = String(reportCell ?? '').trim();
  if (raw === '') return null;
  const match = /^\[(\d+)\]\(([^)]+)\)$/.exec(raw);
  if (!match) return { valid: false, raw };
  const path = match[2];
  const filename = path.split('/').at(-1) ?? '';
  const filenameMatch = /^(\d+)(?:-|\.)/.exec(filename);
  if (!filenameMatch) return { valid: false, raw, path };
  const labelNumber = Number(match[1]);
  const filenameNumber = Number(filenameMatch[1]);
  if (!Number.isSafeInteger(labelNumber) || !Number.isSafeInteger(filenameNumber)) {
    return { valid: false, raw, path };
  }
  return {
    valid: true,
    raw,
    labelNumber,
    filenameNumber,
    label: labelNumber,
    path,
  };
}

export function validateTrackerDocument(text, statusRegistry) {
  const rows = [];
  const errors = [];
  const entryNumbers = new Map();
  const reportNumbers = new Map();
  const lines = String(text).split(/\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const row = parseTrackerRow(lines[index].replace(/\r$/, ''), index + 1);
    rows.push(row);
    if (row.kind !== 'data') continue;
    errors.push(...row.validationErrors);
    if (row.validationErrors.length > 0) continue;

    if (entryNumbers.has(row.number)) {
      errors.push(error(
        'duplicate-entry-number',
        row.lineNumber,
        `entry number ${row.number} is duplicated (first seen on line ${entryNumbers.get(row.number)})`,
      ));
    } else {
      entryNumbers.set(row.number, row.lineNumber);
    }

    if (!statusRegistry || typeof statusRegistry.resolveStatus !== 'function') {
      errors.push(error('status-registry', row.lineNumber, 'status registry is required'));
    } else if (!statusRegistry.resolveStatus(row.fields.status, 'strict')) {
      errors.push(error('status', row.lineNumber, `unknown or non-canonical status: ${row.fields.status}`));
    }

    const identity = extractReportIdentity(row.fields.report);
    row.reportIdentity = identity;
    if (identity && identity.valid === false) {
      errors.push(error('report-format', row.lineNumber, 'report must be empty or a Markdown link with a numeric label and filename prefix'));
    } else if (identity) {
      if (identity.labelNumber !== identity.filenameNumber) {
        errors.push(error(
          'report-identity',
          row.lineNumber,
          `report label ${identity.labelNumber} does not match filename number ${identity.filenameNumber}`,
        ));
      }
      if (reportNumbers.has(identity.labelNumber)) {
        errors.push(error(
          'duplicate-report-number',
          row.lineNumber,
          `report number ${identity.labelNumber} is duplicated (first seen on line ${reportNumbers.get(identity.labelNumber)})`,
        ));
      } else {
        reportNumbers.set(identity.labelNumber, row.lineNumber);
      }
    }
  }

  return { valid: errors.length === 0, errors, rows };
}

export { FIELD_NAMES };
