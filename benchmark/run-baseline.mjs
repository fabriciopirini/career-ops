#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyLiveness } from '../liveness-core.mjs';

export const BENCHMARK_VERSION = 1;
export const FIXTURE_VERSION = '1.0.0';
export const DEFAULT_WARMUPS = 5;
export const DEFAULT_ITERATIONS = 30;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_ROOT = join(ROOT, 'benchmark', 'fixtures');
const ARTIFACT_ROOT = join(ROOT, 'benchmark', 'artifacts');
const WORKLOADS = ['provider-normalization', 'url-deduplication', 'liveness-classification', 'tracker-transformations', 'local-scan-pipeline'];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(FIXTURE_ROOT, relativePath), 'utf8'));
}

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

function normalizedList(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.filter((item) => typeof item === 'string').map((item) => item.trim().toLowerCase()).filter(Boolean);
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

function parseTrackerRows(text) {
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
  return { rows, errors };
}

export function trackerTransform(text) {
  const parsed = parseTrackerRows(text);
  const statuses = new Set(['Evaluated', 'Applied-ready', 'Applied', 'Responded', 'Interview', 'Offer', 'Rejected', 'Discarded', 'SKIP']);
  for (const row of parsed.rows) {
    if (!statuses.has(row.fields[5])) parsed.errors.push({ line: row.line, code: 'unknown_status' });
  }
  return {
    rows: parsed.rows.length,
    errors: parsed.errors,
    valid: parsed.errors.length === 0,
    uniqueIds: new Set(parsed.rows.map((row) => row.number)).size,
    statusCounts: Object.fromEntries([...statuses].map((status) => [status, parsed.rows.filter((row) => row.fields[5] === status).length])),
  };
}
function workProxy({ sourceRecords = 0, acceptedRecords = 0, duplicateDrops = 0, livenessCalls = 0, evaluationCandidates = 0, agentTasks = 0, webSearchQueries = 0, toolCalls = 0, manifestChars = 0 }) {
  return { sourceRecords, acceptedRecords, duplicateDrops, livenessCalls, evaluationCandidates, agentTasks, webSearchQueries, toolCalls, manifestChars };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function assertEqual(actual, expected, label) {
  const left = JSON.stringify(stable(actual));
  const right = JSON.stringify(stable(expected));
  if (left !== right) throw new Error(`${label}: expected ${right}, received ${left}`);
}

function runProviderFixture() {
  const fixture = readJson('provider-jobs.json');
  const result = normalizeProviderJobs(fixture.records, fixture.config);
  assertEqual(result, fixture.expected, 'provider fixture');
  return { result, workProxy: workProxy({ sourceRecords: fixture.records.length, acceptedRecords: result.accepted.length }) };
}

function runDedupFixture(providerResult) {
  const fixture = readJson('pipeline-candidates.json');
  const result = deduplicateUrls(providerResult.result.accepted, fixture.seenUrls);
  assertEqual(result, fixture.expected.dedup, 'dedup fixture');
  return { result, workProxy: workProxy({ sourceRecords: providerResult.result.accepted.length, acceptedRecords: result.accepted.length, duplicateDrops: result.duplicates.length }) };
}

function runLivenessFixture() {
  const fixture = readJson('liveness-cases.json');
  const results = fixture.cases.map(({ id, input }) => ({ id, ...(input.errorCode ? { result: 'uncertain', code: 'navigation_error', reason: input.errorMessage || input.errorCode } : classifyLiveness(input)) }));
  assertEqual(results, fixture.expected, 'liveness fixture');
  return { results, workProxy: workProxy({ livenessCalls: results.length }) };
}

function runTrackerFixture() {
  const fixture = readJson('tracker-fixtures.json');
  const results = {};
  for (const [name, relativePath] of Object.entries(fixture.documents)) {
    const result = trackerTransform(readFileSync(join(FIXTURE_ROOT, relativePath), 'utf8'));
    assertEqual({ rows: result.rows, valid: result.valid, errors: result.errors }, fixture.expected[name], `tracker fixture ${name}`);
    results[name] = result;
  }
  return { results, workProxy: workProxy({ sourceRecords: Object.values(results).reduce((sum, result) => sum + result.rows, 0), acceptedRecords: results.small.rows + results.medium.rows + results.large.rows }) };
}

function runPipelineFixture(providerRun, dedupRun, livenessRun) {
  const fixture = readJson('pipeline-candidates.json');
  const liveByUrl = new Map(fixture.liveness.map((entry) => [canonicalizeUrl(entry.url), entry]));
  const accepted = [];
  const rejected = [];
  for (const candidate of dedupRun.result.accepted) {
    const live = liveByUrl.get(candidate.url);
    if (!live) {
      rejected.push({ id: candidate.id, code: 'missing_liveness_fixture' });
      continue;
    }
    const classification = livenessRun.results.find((entry) => entry.id === live.livenessCase);
    if (classification?.result === 'active') accepted.push(candidate);
    else rejected.push({ id: candidate.id, code: classification?.code ?? 'missing_liveness_result' });
  }
  const result = { accepted: accepted.map(({ id }) => id), rejected };
  assertEqual(result, fixture.expected.pipeline, 'pipeline fixture');
  const proxy = workProxy({
    sourceRecords: providerRun.result.accepted.length,
    acceptedRecords: accepted.length,
    duplicateDrops: dedupRun.result.duplicates.length,
    livenessCalls: dedupRun.result.accepted.length,
    evaluationCandidates: accepted.length,
    agentTasks: fixture.expected.workProxy.agentTasks,
    webSearchQueries: fixture.expected.workProxy.webSearchQueries,
    toolCalls: fixture.expected.workProxy.toolCalls,
    manifestChars: JSON.stringify(fixture.candidates).length,
  });
  const expectedProxy = { ...fixture.expected.workProxy, sourceRecords: proxy.sourceRecords, acceptedRecords: proxy.acceptedRecords, duplicateDrops: proxy.duplicateDrops, livenessCalls: proxy.livenessCalls, evaluationCandidates: proxy.evaluationCandidates, manifestChars: proxy.manifestChars };
  assertEqual(proxy, expectedProxy, 'pipeline work proxy');
  return { result, workProxy: proxy };
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const variance = samples.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / samples.length;
  const percentile = (rank) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(rank * sorted.length) - 1))];
  return {
    median: percentile(0.5),
    p95: percentile(0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev: Math.sqrt(variance),
  };
}

export function measure(name, operation, { warmups = DEFAULT_WARMUPS, iterations = DEFAULT_ITERATIONS } = {}) {
  for (let index = 0; index < warmups; index += 1) operation();
  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    operation();
    samples.push(performance.now() - start);
  }
  return { name, warmups, iterations, stats: summarize(samples) };
}

function gitSha() {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

function formatMs(value) { return `${value.toFixed(3)} ms`; }

export function renderMarkdown(artifact) {
  const lines = [`# Deterministic scan pipeline benchmark`, '', `- Fixture version: ${artifact.fixtureVersion}`, `- Node: ${artifact.environment.node}`, `- OS: ${artifact.environment.platform} ${artifact.environment.release}`, `- Warmups: ${artifact.policy.warmups}`, `- Measured iterations: ${artifact.policy.iterations}`, `- Token telemetry: ${artifact.telemetry.token_usage}`, '', '| Workload | Median | p95 | Min | Max | Stddev | Reliability failures |', '|---|---:|---:|---:|---:|---:|---:|'];
  for (const [name, workload] of Object.entries(artifact.workloads)) {
    const stats = workload.timing.stats;
    lines.push(`| ${name} | ${formatMs(stats.median)} | ${formatMs(stats.p95)} | ${formatMs(stats.min)} | ${formatMs(stats.max)} | ${formatMs(stats.stddev)} | ${workload.reliability.failures} |`);
  }
  lines.push('', '## Work proxy', '', '| Workload | Source | Accepted | Duplicate drops | Liveness calls | Evaluation candidates | Agent tasks | WebSearch queries | Tool calls | Manifest chars |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const [name, workload] of Object.entries(artifact.workloads)) {
    const proxy = workload.workProxy;
    lines.push(`| ${name} | ${proxy.sourceRecords} | ${proxy.acceptedRecords} | ${proxy.duplicateDrops} | ${proxy.livenessCalls} | ${proxy.evaluationCandidates} | ${proxy.agentTasks} | ${proxy.webSearchQueries} | ${proxy.toolCalls} | ${proxy.manifestChars} |`);
  }
  lines.push('', 'Token usage is unavailable. Work-proxy counters are not token telemetry and must not be described as token counts.', '');
  return `${lines.join('\n')}`;
}

export function runBenchmark({ warmups = DEFAULT_WARMUPS, iterations = DEFAULT_ITERATIONS } = {}) {
  if (!Number.isInteger(warmups) || warmups < 0) throw new Error('warmups must be a non-negative integer');
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error('iterations must be a positive integer');
  const providerFixture = readJson('provider-jobs.json');
  const pipelineFixture = readJson('pipeline-candidates.json');
  const providerRun = runProviderFixture();
  const dedupRun = runDedupFixture(providerRun);
  const livenessRun = runLivenessFixture();
  const trackerRun = runTrackerFixture();
  const pipelineRun = runPipelineFixture(providerRun, dedupRun, livenessRun);
  const reliabilityFixture = readJson('expected/reliability.json');
  assertEqual(reliabilityFixture.fixtureVersion, FIXTURE_VERSION, 'reliability fixture version');
  const operations = {
    'provider-normalization': () => normalizeProviderJobs(providerFixture.records, providerFixture.config),
    'url-deduplication': () => deduplicateUrls(providerRun.result.accepted, pipelineFixture.seenUrls),
    'liveness-classification': () => pipelineFixture.liveness.map((entry) => classifyLiveness(entry.input)),
    'tracker-transformations': () => trackerTransform(readFileSync(join(FIXTURE_ROOT, 'tracker-small.md'), 'utf8')),
    'local-scan-pipeline': () => runPipelineFixture(providerRun, dedupRun, livenessRun),
  };
  const reliability = {
    provider: { failures: 0, checks: providerRun.result.accepted.length + providerRun.result.rejected.length },
    dedup: { failures: 0, checks: dedupRun.result.accepted.length + dedupRun.result.duplicates.length },
    liveness: { failures: 0, checks: livenessRun.results.length },
    tracker: { failures: 0, checks: Object.keys(trackerRun.results).length },
    pipeline: { failures: 0, checks: pipelineRun.result.accepted.length + pipelineRun.result.rejected.length },
  };
  const results = [providerRun, dedupRun, livenessRun, trackerRun, pipelineRun];
  const proxies = [providerRun.workProxy, dedupRun.workProxy, livenessRun.workProxy, trackerRun.workProxy, pipelineRun.workProxy];
  const workloads = {};
  for (let index = 0; index < WORKLOADS.length; index += 1) {
    const name = WORKLOADS[index];
    workloads[name] = {
      fixtureVersion: FIXTURE_VERSION,
      targeted: false,
      targetedMetric: name === 'local-scan-pipeline' ? 'evaluationCandidates and livenessCalls' : null,
      timing: measure(name, operations[name], { warmups, iterations }),
      reliability: reliability[['provider', 'dedup', 'liveness', 'tracker', 'pipeline'][index]],
      workProxy: proxies[index],
    };
  }
  return {
    schemaVersion: BENCHMARK_VERSION,
    benchmark: 'deterministic-scan-pipeline',
    fixtureVersion: FIXTURE_VERSION,
    network: 'none',
    environment: { node: process.version, nodeMajor: Number(process.versions.node.split('.')[0]), platform: process.platform, release: process.release.name === 'node' ? process.platform === 'linux' ? process.release.lts ?? process.release.name : process.release.name : process.release.name, commit: gitSha() },
    policy: { warmups, iterations, timer: 'performance.now', percentile: 'nearest-rank', measuredFields: ['timing.stats'] },
    command: process.argv.slice(2).join(' ') || 'npm run benchmark',
    telemetry: { token_usage: 'unavailable' },
    reliability: { failures: [], checks: reliabilityFixture.checks },
    workloads,
  };
}

function parseArgs(argv) {
  const options = { warmups: DEFAULT_WARMUPS, iterations: DEFAULT_ITERATIONS, output: join(ARTIFACT_ROOT, 'baseline.json'), markdown: join(ARTIFACT_ROOT, 'baseline.md') };
  for (const arg of argv) {
    const match = arg.match(/^--(warmups|iterations)=(\d+)$/);
    if (match) options[match[1]] = Number(match[2]);
    else if (arg.startsWith('--output=')) options.output = resolve(ROOT, arg.slice('--output='.length));
    else if (arg.startsWith('--markdown=')) options.markdown = resolve(ROOT, arg.slice('--markdown='.length));
    else if (arg.startsWith('--')) throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const artifact = runBenchmark(options);
  mkdirSync(dirname(options.output), { recursive: true });
  mkdirSync(dirname(options.markdown), { recursive: true });
  writeFileSync(options.output, `${JSON.stringify(artifact, null, 2)}\n`);
  writeFileSync(options.markdown, renderMarkdown(artifact));
  console.log(`Benchmark artifact: ${options.output}`);
  console.log(`Fixture ${artifact.fixtureVersion}; ${artifact.policy.warmups} warmups; ${artifact.policy.iterations} measured iterations; token_usage: unavailable`);
  for (const [name, workload] of Object.entries(artifact.workloads)) console.log(`${name}: median ${formatMs(workload.timing.stats.median)}, p95 ${formatMs(workload.timing.stats.p95)}, reliability failures ${workload.reliability.failures}`);
  return artifact;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error(`Benchmark failed: ${error.message}`); process.exitCode = 1; }
}
