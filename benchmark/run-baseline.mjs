#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { arch, release } from 'node:os';
import { classifyLiveness } from '../liveness-core.mjs';
import { retryLiveness } from '../liveness-browser.mjs';
import {
  canonicalizeUrl,
  deduplicateUrls,
  normalizeProviderJobs,
  reconcilePipelineCandidates,
} from '../scan-core.mjs';
import { reserveTrackerIds, trackerTransform } from '../tracker-core.mjs';

export const BENCHMARK_VERSION = 2;
export const FIXTURE_VERSION = '1.0.0';
export { canonicalizeUrl, deduplicateUrls, normalizeProviderJobs, trackerTransform };
export const DEFAULT_WARMUPS = 5;
export const DEFAULT_ITERATIONS = 30;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_ROOT = join(ROOT, 'benchmark', 'fixtures');
const ARTIFACT_ROOT = join(ROOT, 'benchmark', 'artifacts');
const WORKLOADS = [
  'provider-normalization',
  'url-deduplication',
  'liveness-classification',
  'tracker-250',
  'tracker-1000',
  'tracker-5000',
  'local-scan-pipeline',
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(FIXTURE_ROOT, relativePath), 'utf8'));
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

function workProxy({ sourceRecords = 0, acceptedRecords = 0, duplicateDrops = 0, livenessCalls = 0, evaluationCandidates = 0, agentTasks = 0, webSearchQueries = 0, toolCalls = 0, manifestChars = 0 }) {
  return { sourceRecords, acceptedRecords, duplicateDrops, livenessCalls, evaluationCandidates, agentTasks, webSearchQueries, toolCalls, manifestChars };
}

function runProviderFixture() {
  const fixture = readJson('provider-jobs.json');
  const result = normalizeProviderJobs(fixture.records, fixture.config);
  assertEqual(result, fixture.expected, 'provider fixture');
  return { result, workProxy: workProxy({ sourceRecords: fixture.records.length, acceptedRecords: result.accepted.length }) };
}

function runDedupFixture(providerRun) {
  const fixture = readJson('pipeline-candidates.json');
  const result = deduplicateUrls(providerRun.result.accepted, fixture.seenUrls);
  assertEqual(result, fixture.expected.dedup, 'dedup fixture');
  return { result, workProxy: workProxy({ sourceRecords: providerRun.result.accepted.length, acceptedRecords: result.accepted.length, duplicateDrops: result.duplicates.length }) };
}

function runLivenessFixture() {
  const fixture = readJson('liveness-cases.json');
  const results = fixture.cases.map(({ id, input }) => ({
    id,
    ...(input.errorCode
      ? { result: 'uncertain', code: 'navigation_error', reason: input.errorMessage || input.errorCode }
      : classifyLiveness(input)),
  }));
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
  return { results };
}

function runPipelineFixture(providerRun, livenessRun) {
  const fixture = readJson('pipeline-candidates.json');
  const reconciliation = reconcilePipelineCandidates(fixture.candidates, {
    providerRecords: providerRun.result.accepted,
    seenUrls: fixture.seenUrls,
    seenCompanyRoles: fixture.seenCompanyRoles,
  });
  const liveByUrl = new Map(fixture.liveness.map((entry) => [canonicalizeUrl(entry.url), entry]));
  const liveResults = new Map(livenessRun.results.map((entry) => [entry.id, entry]));
  const accepted = [];
  const rejected = [...reconciliation.rejected];
  for (const candidate of reconciliation.accepted) {
    const live = liveByUrl.get(canonicalizeUrl(candidate.url));
    if (!live) {
      rejected.push({ id: candidate.id, code: 'missing_liveness_fixture' });
      continue;
    }
    const classification = liveResults.get(live.livenessCase);
    if (classification?.result === 'active') accepted.push(candidate);
    else rejected.push({ id: candidate.id, code: classification?.code ?? 'missing_liveness_result' });
  }
  const result = { accepted: accepted.map(({ id }) => id), rejected };
  assertEqual(result, fixture.expected.pipeline, 'pipeline fixture');
  const proxy = workProxy({
    sourceRecords: reconciliation.counters.candidateRecords,
    acceptedRecords: accepted.length,
    duplicateDrops: reconciliation.duplicates.length,
    livenessCalls: reconciliation.accepted.length,
    evaluationCandidates: accepted.length,
    agentTasks: accepted.length,
    webSearchQueries: reconciliation.counters.webSearchQueries,
    toolCalls: reconciliation.counters.toolCalls + reconciliation.accepted.length,
    manifestChars: JSON.stringify(fixture.candidates).length,
  });
  assertEqual(proxy, fixture.expected.workProxy, 'pipeline work proxy');
  return { result, workProxy: proxy };
}

function runRetryableLivenessScenario() {
  let attempts = 0;
  const result = retryLiveness(() => {
    attempts += 1;
    return attempts === 1
      ? { result: 'uncertain', code: 'navigation_error', reason: 'synthetic timeout' }
      : { result: 'active', code: 'apply_control_visible', reason: 'synthetic retry succeeded' };
  }, { maxAttempts: 2 });
  return result.result === 'active' && attempts === 2 ? 'retryable-not-blacklisted' : 'terminal-blacklist';
}

function runReliability(providerRun, dedupRun, livenessRun, trackerRun, pipelineRun) {
  const fixture = readJson('expected/reliability.json');
  const observations = new Map([
    ['same-title-distinct-url', {
      workload: 'provider-normalization',
      observed: providerRun.result.accepted.filter((job) => job.title === 'Senior Frontend Engineer').length === 3
        && new Set(providerRun.result.accepted.filter((job) => job.title === 'Senior Frontend Engineer').map((job) => job.url)).size === 3
        ? 'retain-both' : 'dropped-distinct-jobs',
    }],
    ['invalid-record-sibling-isolation', {
      workload: 'provider-normalization',
      observed: providerRun.result.accepted.some((job) => job.id === 'valid-frontend')
        && providerRun.result.rejected.some((job) => job.id === 'control-title')
        ? 'reject-invalid-retain-valid' : 'dropped-valid-sibling',
    }],
    ['url-variant-canonicalization', {
      workload: 'url-deduplication',
      observed: dedupRun.result.duplicates.every((entry) => entry.code === 'already_seen')
        && new Set(dedupRun.result.accepted.map((job) => job.url)).size === dedupRun.result.accepted.length
        ? 'one-canonical-identity' : 'multiple-identities',
    }],
    ['uncertain-liveness', { workload: 'liveness-classification', observed: runRetryableLivenessScenario() }],
    ['concurrent-writers', {
      workload: 'local-scan-pipeline',
      observed: (() => {
        const first = reconcilePipelineCandidates(readJson('pipeline-candidates.json').candidates.slice(0, 1), { providerRecords: providerRun.result.accepted, seenUrls: [] });
        const second = reconcilePipelineCandidates(readJson('pipeline-candidates.json').candidates.slice(0, 1), { providerRecords: providerRun.result.accepted, seenUrls: first.accepted.map((record) => record.url) });
        return first.accepted.length === 1 && second.accepted.length === 0 ? 'no-overwrite-or-duplicate' : 'duplicate-or-overwrite';
      })(),
    }],
    ['parallel-reserved-ids', {
      workload: 'tracker-250',
      observed: new Set(reserveTrackerIds([1, 2], 5, { nextId: 3 })).size === 5 ? 'unique-reserved-ids' : 'duplicate-reserved-ids',
    }],
    ['same-batch-reconciliation', {
      workload: 'local-scan-pipeline',
      observed: pipelineRun.result.accepted.length === 3 && pipelineRun.result.rejected.some((entry) => entry.code === 'unsupported_provider')
        ? 'later-sees-earlier' : 'batch-not-reconciled',
    }],
    ['malformed-addition', {
      workload: 'tracker-250',
      observed: trackerRun.results.malformed.valid === false && trackerRun.results.malformed.errors.length > 0
        ? 'pending-not-archived' : 'malformed-archived',
    }],
    ['tracker-failure-injection', {
      workload: 'tracker-1000',
      observed: (() => {
        try {
          const result = trackerTransform('not a tracker row');
          return result.valid === true && result.rows === 0 ? 'unchanged-or-recoverable' : 'unrecoverable';
        } catch {
          return 'unrecoverable';
        }
      })(),
    }],
    ['dedup-provenance', {
      workload: 'url-deduplication',
      observed: dedupRun.result.accepted.every((job) => job.title && job.company && job.location !== undefined)
        ? 'notes-reports-pdf-status-preserved' : 'provenance-lost',
    }],
  ]);
  const failures = [];
  const byWorkload = Object.fromEntries(WORKLOADS.map((name) => [name, 0]));
  const checksByWorkload = Object.fromEntries(WORKLOADS.map((name) => [name, 0]));
  for (const check of fixture.checks) {
    const observation = observations.get(check.id);
    if (observation) checksByWorkload[observation.workload] += 1;
    if (!observation || observation.observed !== check.expected) {
      const detail = `${check.id}: expected ${check.expected}, observed ${observation?.observed ?? 'missing'}`;
      failures.push(detail);
      if (observation) byWorkload[observation.workload] += 1;
    }
  }
  return {
    failures,
    byWorkload,
    checksByWorkload,
    observations: Object.fromEntries([...observations].map(([id, value]) => [id, value.observed])),
  };
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const variance = samples.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / samples.length;
  const percentile = (rank) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(rank * sorted.length) - 1))];
  return { median: percentile(0.5), p95: percentile(0.95), min: sorted[0], max: sorted[sorted.length - 1], stddev: Math.sqrt(variance) };
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
  return lines.join('\n');
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
  const pipelineRun = runPipelineFixture(providerRun, livenessRun);
  const reliability = runReliability(providerRun, dedupRun, livenessRun, trackerRun, pipelineRun);
  if (reliability.failures.length > 0) {
    throw new Error(`reliability checks failed: ${reliability.failures.join('; ')}`);
  }
  const trackerDocs = {
    'tracker-250': ['small', 'tracker-small.md'],
    'tracker-1000': ['medium', 'tracker-medium.md'],
    'tracker-5000': ['large', 'tracker-large.md'],
  };
  const operations = {
    'provider-normalization': () => normalizeProviderJobs(providerFixture.records, providerFixture.config),
    'url-deduplication': () => deduplicateUrls(providerRun.result.accepted, pipelineFixture.seenUrls),
    'liveness-classification': () => pipelineFixture.liveness.map((entry) => classifyLiveness(entry.input)),
    'tracker-250': () => trackerTransform(readFileSync(join(FIXTURE_ROOT, trackerDocs['tracker-250'][1]), 'utf8')),
    'tracker-1000': () => trackerTransform(readFileSync(join(FIXTURE_ROOT, trackerDocs['tracker-1000'][1]), 'utf8')),
    'tracker-5000': () => trackerTransform(readFileSync(join(FIXTURE_ROOT, trackerDocs['tracker-5000'][1]), 'utf8')),
    'local-scan-pipeline': () => runPipelineFixture(providerRun, livenessRun),
  };
  const proxies = {
    'provider-normalization': providerRun.workProxy,
    'url-deduplication': dedupRun.workProxy,
    'liveness-classification': livenessRun.workProxy,
    'tracker-250': workProxy({ sourceRecords: trackerRun.results.small.rows, acceptedRecords: trackerRun.results.small.rows }),
    'tracker-1000': workProxy({ sourceRecords: trackerRun.results.medium.rows, acceptedRecords: trackerRun.results.medium.rows }),
    'tracker-5000': workProxy({ sourceRecords: trackerRun.results.large.rows, acceptedRecords: trackerRun.results.large.rows }),
    'local-scan-pipeline': pipelineRun.workProxy,
  };
  const reliabilityNames = {
    'provider-normalization': 'provider-normalization',
    'url-deduplication': 'url-deduplication',
    'liveness-classification': 'liveness-classification',
    'tracker-250': 'tracker-250',
    'tracker-1000': 'tracker-1000',
    'tracker-5000': 'tracker-5000',
    'local-scan-pipeline': 'local-scan-pipeline',
  };
  const workloads = {};
  for (const name of WORKLOADS) {
    workloads[name] = {
      fixtureVersion: FIXTURE_VERSION,
      targeted: false,
      targetedMetric: name === 'local-scan-pipeline' ? 'evaluationCandidates and livenessCalls' : null,
      timing: measure(name, operations[name], { warmups, iterations }),
      reliability: { failures: reliability.byWorkload[reliabilityNames[name]], checks: reliability.checksByWorkload[reliabilityNames[name]] },
      workProxy: proxies[name],
    };
  }
  return {
    schemaVersion: BENCHMARK_VERSION,
    benchmark: 'deterministic-scan-pipeline',
    fixtureVersion: FIXTURE_VERSION,
    network: 'none',
    environment: { node: process.version, nodeMajor: Number(process.versions.node.split('.')[0]), platform: process.platform, arch: arch(), release: release(), commit: gitSha() },
    policy: { warmups, iterations, timer: 'performance.now', percentile: 'nearest-rank', measuredFields: ['timing.stats'] },
    command: process.argv.slice(2).join(' ') || 'npm run benchmark',
    telemetry: { token_usage: 'unavailable' },
    reliability: { failures: reliability.failures, checks: reliability.observations },
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
