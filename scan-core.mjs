export function canonicalizeUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|gh_src$)/i.test(key)) url.searchParams.delete(key);
    }
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.href;
  } catch {
    return null;
  }
}

export function normalizeProviderJobs(records, config = {}) {
  const positive = normalizedList(config.titleFilter?.positive);
  const negative = normalizedList(config.titleFilter?.negative);
  const allow = normalizedList(config.locationFilter?.allow);
  const block = normalizedList(config.locationFilter?.block);
  const alwaysAllow = normalizedList(config.locationFilter?.alwaysAllow ?? config.locationFilter?.always_allow);
  const accepted = [];
  const rejected = [];
  for (const record of records) {
    const id = record?.id ?? null;
    if (!record || typeof record !== 'object') {
      rejected.push({ id, code: 'invalid_record' });
      continue;
    }
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) {
      rejected.push({ id, code: 'missing_title' });
      continue;
    }
    const company = typeof record.company === 'string' ? record.company.trim() : '';
    const location = typeof record.location === 'string' ? record.location.trim() : '';
    if ([title, company, location].some((value) => /[\u0000-\u001f\u007f|]/.test(value))) {
      rejected.push({ id, code: 'invalid_field' });
      continue;
    }
    const url = canonicalizeUrl(record.url);
    if (!url) {
      rejected.push({ id, code: typeof record.url === 'string' && record.url.trim() ? 'unsupported_url' : 'missing_url' });
      continue;
    }
    const lowerTitle = title.toLowerCase();
    if (positive.length && !positive.some((term) => lowerTitle.includes(term))) {
      rejected.push({ id, code: 'title_filter' });
      continue;
    }
    if (negative.some((term) => lowerTitle.includes(term))) {
      rejected.push({ id, code: 'title_filter_negative' });
      continue;
    }
    const lowerLocation = location.toLowerCase();
    if (location && !alwaysAllow.some((term) => lowerLocation.includes(term)) && block.some((term) => lowerLocation.includes(term))) {
      rejected.push({ id, code: 'location_block' });
      continue;
    }
    if (location && !alwaysAllow.some((term) => lowerLocation.includes(term)) && allow.length && !allow.some((term) => lowerLocation.includes(term))) {
      rejected.push({ id, code: 'location_allow' });
      continue;
    }
    accepted.push({ id, title, url, company, location });
  }
  return { accepted, rejected };
}

function normalizedList(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.filter((item) => typeof item === 'string').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export function deduplicateUrls(candidates, seen = []) {
  const seenCanonical = new Set(seen.map(canonicalizeUrl).filter(Boolean));
  const accepted = [];
  const duplicates = [];
  for (const candidate of candidates) {
    const canonicalUrl = canonicalizeUrl(candidate.url);
    if (!canonicalUrl) {
      duplicates.push({ id: candidate.id, code: 'invalid_url' });
      continue;
    }
    if (seenCanonical.has(canonicalUrl)) {
      duplicates.push({ id: candidate.id, code: 'already_seen', canonicalUrl });
      continue;
    }
    seenCanonical.add(canonicalUrl);
    accepted.push({ ...candidate, url: canonicalUrl });
  }
  return { accepted, duplicates };
}

export function reconcileProviderJobs(jobs, {
  titleFilter = () => true,
  locationFilter = () => true,
  seenUrls = new Set(),
  seenCompanyRoles = new Set(),
  sourceName = 'provider',
} = {}) {
  const newOffers = [];
  const stats = { totalFound: 0, totalFilteredTitle: 0, totalFilteredLocation: 0, totalDupes: 0 };
  for (const job of jobs) {
    stats.totalFound += 1;
    if (!titleFilter(job.title)) {
      stats.totalFilteredTitle += 1;
      continue;
    }
    if (!locationFilter(job.location)) {
      stats.totalFilteredLocation += 1;
      continue;
    }
    if (seenUrls.has(job.url)) {
      stats.totalDupes += 1;
      continue;
    }
    const key = `${job.company.toLowerCase()}::${job.title.toLowerCase()}`;
    if (seenCompanyRoles.has(key)) {
      stats.totalDupes += 1;
      continue;
    }
    seenUrls.add(job.url);
    seenCompanyRoles.add(key);
    newOffers.push({ ...job, source: sourceName });
  }
  return { offers: newOffers, stats };
}

export function reconcilePipelineCandidates(candidates, {
  providerRecords = [],
  seenUrls = [],
  seenCompanyRoles = [],
} = {}) {
  const providerByUrl = new Map(providerRecords.map((record) => [canonicalizeUrl(record.url), record]).filter(([url]) => url));
  const seen = new Set(seenUrls.map(canonicalizeUrl).filter(Boolean));
  const seenRoles = new Set(seenCompanyRoles);
  const accepted = [];
  const duplicates = [];
  const rejected = [];
  const counters = {
    candidateRecords: candidates.length,
    webSearchQueries: new Set(candidates.map((candidate) => candidate.query).filter((query) => typeof query === 'string' && query.trim())).size,
    toolCalls: 0,
  };
  for (const candidate of candidates) {
    counters.toolCalls += 1;
    const id = candidate?.id ?? null;
    if (candidate?.provider && candidate.provider !== 'synthetic') {
      rejected.push({ id, code: 'unsupported_provider' });
      continue;
    }
    const canonicalUrl = canonicalizeUrl(candidate?.url);
    if (!canonicalUrl) {
      rejected.push({ id, code: 'invalid_url' });
      continue;
    }
    const record = providerByUrl.get(canonicalUrl);
    if (!record) {
      rejected.push({ id, code: 'missing_provider_record' });
      continue;
    }
    const role = `${record.company.toLowerCase()}::${record.title.toLowerCase()}`;
    if (seen.has(canonicalUrl) || seenRoles.has(role)) {
      duplicates.push({ id: record.id, code: 'already_seen', canonicalUrl });
      continue;
    }
    if (accepted.some((item) => item.id === record.id)) {
      duplicates.push({ id: record.id, code: 'duplicate_candidate', canonicalUrl });
      continue;
    }
    seen.add(canonicalUrl);
    seenRoles.add(role);
    accepted.push({ ...record, url: canonicalUrl });
  }
  return { accepted, duplicates, rejected, counters };
}
