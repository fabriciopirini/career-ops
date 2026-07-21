const REPORT_PREFIX = /^(\d+)(?=-|\.|$)/;
const VALID_STATES = new Set(['reserved', 'committed', 'abandoned']);
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;


function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function requirePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
}

function requireTimestamp(value, label) {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || Number.isNaN(Date.parse(value))
  ) {
    throw new TypeError(`${label} must be a valid ISO timestamp`);
  }
}

function requireHttpUrl(value, label = 'URL') {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be an absolute HTTP(S) URL`);
  }
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new TypeError(`${label} must be an absolute HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.hostname === '') {
    throw new TypeError(`${label} must be an absolute HTTP(S) URL`);
  }
}

/**
 * Parse unchecked rows in the Pending section of a pipeline markdown file.
 * The returned lineNumber is one-based and points at the original markdown row.
 */
export function parsePendingPipeline(text) {
  if (typeof text !== 'string') throw new TypeError('pipeline text must be a string');

  const pending = [];
  const seenUrls = new Set();
  let inPending = false;
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      inPending = heading[1].trim().toLocaleLowerCase('en-US') === 'pending';
      continue;
    }
    if (!inPending || !/^\s*-\s+\[\s\]/.test(line)) continue;

    const match = /^\s*-\s+\[\s\]\s*(.*?)\s*$/.exec(line);
    if (!match || match[1] === '') {
      throw new TypeError(`malformed pending row at line ${index + 1}`);
    }

    const fields = match[1].split('|').map((field) => field.trim());
    if (fields.length > 3 || fields.some((field) => field === '')) {
      throw new TypeError(`malformed pending row at line ${index + 1}`);
    }

    const [url, company, title] = fields;
    requireHttpUrl(url, `pending URL at line ${index + 1}`);
    if (seenUrls.has(url)) throw new TypeError(`duplicate pending URL at line ${index + 1}: ${url}`);
    seenUrls.add(url);

    const row = { url, lineNumber: index + 1 };
    if (company !== undefined) row.company = company;
    if (title !== undefined) row.title = title;
    pending.push(row);
  }

  return pending;
}

function reportIdFromName(name) {
  if (typeof name !== 'string' || name.trim() === '') throw new TypeError('report name must be a non-empty string');
  if (name === '.gitkeep') return null;
  const match = REPORT_PREFIX.exec(name);
  if (!match) throw new TypeError(`report filename has no numeric prefix: ${name}`);
  const reportId = Number(match[1]);
  requirePositiveInteger(reportId, `report filename ${name}`);
  return reportId;
}

function manifestJobs(manifest) {
  validateReservationManifest(manifest);
  if (manifest.state === 'abandoned') return [];
  return manifest.jobs.filter((job) => job.state !== 'abandoned');
}

/**
 * Return every report number already occupied by a report filename or an
 * explicitly non-abandoned reservation manifest.
 */
export function collectOccupiedReportIds(reportNames, activeManifests = []) {
  if (!Array.isArray(reportNames)) throw new TypeError('reportNames must be an array');
  if (!Array.isArray(activeManifests)) throw new TypeError('activeManifests must be an array');

  const occupied = new Set();
  for (const name of reportNames) {
    const reportId = reportIdFromName(name);
    if (reportId !== null) occupied.add(reportId);
  }

  for (const manifest of activeManifests) {
    for (const job of manifestJobs(manifest)) occupied.add(job.reportId);
  }
  return occupied;
}

/**
 * Allocate IDs in pipeline order, preserving the existing max-plus-one
 * numbering convention while skipping all occupied IDs.
 */
export function allocateReportIds(pending, occupied = new Set()) {
  if (!Array.isArray(pending)) throw new TypeError('pending must be an array');
  if (!(occupied instanceof Set) && !Array.isArray(occupied)) {
    throw new TypeError('occupied must be a Set or array');
  }

  const used = new Set(occupied);
  let highest = 0;
  for (const reportId of used) {
    requirePositiveInteger(reportId, 'occupied report ID');
    highest = Math.max(highest, reportId);
  }
  let next = highest + 1;
  if (!Number.isSafeInteger(next)) throw new RangeError('report ID space exhausted');

  return pending.map((job) => {
    requireObject(job, 'pending job');
    requireHttpUrl(job.url, 'pending job URL');
    while (used.has(next)) {
      next += 1;
      if (!Number.isSafeInteger(next)) throw new RangeError('report ID space exhausted');
    }
    const reportId = next;
    used.add(reportId);
    next += 1;
    return { ...job, reportId };
  });
}

/**
 * Validate one durable reservation manifest. Throws rather than repairing so
 * callers cannot allocate against ambiguous operational state.
 */
export function validateReservationManifest(manifest) {
  requireObject(manifest, 'reservation manifest');
  if (manifest.version !== 1) throw new TypeError('reservation manifest version must be 1');
  if (typeof manifest.runId !== 'string' || manifest.runId.trim() === '') {
    throw new TypeError('reservation manifest runId must be a non-empty string');
  }
  requireTimestamp(manifest.createdAt, 'reservation manifest createdAt');
  if (manifest.state !== undefined && !VALID_STATES.has(manifest.state)) {
    throw new TypeError(`reservation manifest state is invalid: ${manifest.state}`);
  }
  if (!Array.isArray(manifest.jobs) || manifest.jobs.length === 0) {
    throw new TypeError('reservation manifest jobs must be a non-empty array');
  }

  const urls = new Set();
  const reportIds = new Set();
  for (const [index, job] of manifest.jobs.entries()) {
    requireObject(job, `reservation manifest job ${index + 1}`);
    requirePositiveInteger(job.pipelineLine, `reservation manifest job ${index + 1} pipelineLine`);
    requireHttpUrl(job.url, `reservation manifest job ${index + 1} URL`);
    requirePositiveInteger(job.reportId, `reservation manifest job ${index + 1} reportId`);
    if (!VALID_STATES.has(job.state)) {
      throw new TypeError(`reservation manifest job ${index + 1} state is invalid: ${job.state}`);
    }
    if (urls.has(job.url)) throw new TypeError(`reservation manifest has duplicate URL: ${job.url}`);
    if (reportIds.has(job.reportId)) throw new TypeError(`reservation manifest has duplicate report ID: ${job.reportId}`);
    urls.add(job.url);
    reportIds.add(job.reportId);
  }

  return true;
}

export { VALID_STATES };
