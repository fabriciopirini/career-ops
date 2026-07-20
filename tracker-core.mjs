const STATUSES = new Set(['Evaluated', 'Applied-ready', 'Applied', 'Responded', 'Interview', 'Offer', 'Rejected', 'Discarded', 'SKIP']);

export function trackerTransform(text) {
  const rows = [];
  const errors = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.startsWith('|') || /^\|\s*#\s*\|/i.test(line) || /^\|\s*-+/.test(line)) continue;
    const fields = line.split('|').slice(1, -1).map((field) => field.trim());
    if (fields.length !== 9) {
      errors.push({ line: index + 1, code: 'field_count' });
      continue;
    }
    const number = Number(fields[0]);
    if (!Number.isInteger(number) || number <= 0) errors.push({ line: index + 1, code: 'invalid_id' });
    rows.push({ line: index + 1, number, fields });
  }
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row.number)) errors.push({ line: row.line, code: 'duplicate_id' });
    ids.add(row.number);
  }
  for (const row of rows) {
    if (!STATUSES.has(row.fields[5])) errors.push({ line: row.line, code: 'unknown_status' });
  }
  return {
    rows: rows.length,
    errors,
    valid: errors.length === 0,
    uniqueIds: ids.size,
    statusCounts: Object.fromEntries([...STATUSES].map((status) => [status, rows.filter((row) => row.fields[5] === status).length])),
  };
}

export function reserveTrackerIds(existingIds, additions, { nextId = Math.max(0, ...existingIds, 0) + 1 } = {}) {
  const used = new Set(existingIds);
  const reserved = [];
  let candidate = nextId;
  for (let index = 0; index < additions; index += 1) {
    while (used.has(candidate)) candidate += 1;
    used.add(candidate);
    reserved.push(candidate);
    candidate += 1;
  }
  return reserved;
}
