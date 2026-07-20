#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { arch, release, tmpdir } from 'node:os';
import { classifyLiveness } from '../liveness-core.mjs';
import { createLivenessRoutingState, routeRetryableLiveness } from '../liveness-browser.mjs';
import { commitText } from '../persistence-core.mjs';
import {
  canonicalizeUrl,
  deduplicateUrls,
  normalizeProviderJobs,
  reconcilePipelineCandidates,
} from '../scan-core.mjs';
import { parseTrackerRows, reserveTrackerIds, trackerTransform } from '../tracker-core.mjs';

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

function syntheticWorkProxy({ sourceRecords = 0, acceptedRecords = 0, duplicateDrops = 0, livenessCalls = 0, evaluationCandidates = 0, agentTasks = 0, webSearchQueries = 0, toolCalls = 0, manifestChars = 0 }) { return { sourceRecords, acceptedRecords, duplicateDrops, livenessCalls, evaluationCandidates, agentTasks, webSearchQueries, toolCalls, manifestChars }; }

function createInstrumentedAdapters() {
  const queries = new Set();
  const counters = { agentTasks: 0, webSearchQueries: 0, toolCalls: 0, livenessCalls: 0 };
  return {
    webSearch(query) {
      if (typeof query === 'string' && query.trim() && !queries.has(query)) {
        queries.add(query);
        counters.webSearchQueries += 1;
      }
      return { query };
    },
    toolCall() {
      counters.toolCalls += 1;
    },
    livenessCheck() {
      counters.livenessCalls += 1;
    },
    agentTask() {
      counters.agentTasks += 1;
    },
    snapshot() {
      return { ...counters };
    },
  };
}

function runProviderFixture() {
  const fixture = readJson('provider-jobs.json');
  const result = normalizeProviderJobs(fixture.records, fixture.config);
  assertEqual(result, fixture.expected, 'provider fixture');
  return { result, syntheticWorkProxy: syntheticWorkProxy({ sourceRecords: fixture.records.length, acceptedRecords: result.accepted.length }) };
}

function runDedupFixture(providerRun) {
  const fixture = readJson('pipeline-candidates.json');
  const result = deduplicateUrls(providerRun.result.accepted, fixture.seenUrls);
  assertEqual(result, fixture.expected.dedup, 'dedup fixture');
  return { result, syntheticWorkProxy: syntheticWorkProxy({ sourceRecords: providerRun.result.accepted.length, acceptedRecords: result.accepted.length, duplicateDrops: result.duplicates.length }) };
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
  return { results, syntheticWorkProxy: syntheticWorkProxy({ livenessCalls: results.length }) };
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
  const adapters = createInstrumentedAdapters();
  for (const candidate of fixture.candidates) {
    adapters.webSearch(candidate.query);
    adapters.toolCall('reconcile-candidate');
  }
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
    adapters.toolCall('liveness');
    adapters.livenessCheck(candidate.url);
    const classification = liveResults.get(live.livenessCase);
    if (classification?.result === 'active') {
      accepted.push(candidate);
      adapters.agentTask(candidate);
    } else rejected.push({ id: candidate.id, code: classification?.code ?? 'missing_liveness_result' });
  }
  const result = { accepted: accepted.map(({ id }) => id), rejected };
  assertEqual(result, fixture.expected.pipeline, 'pipeline fixture');
  const counters = adapters.snapshot();
  const proxy = syntheticWorkProxy({
    sourceRecords: reconciliation.counters.candidateRecords,
    acceptedRecords: accepted.length,
    duplicateDrops: reconciliation.duplicates.length,
    livenessCalls: counters.livenessCalls,
    evaluationCandidates: counters.agentTasks,
    agentTasks: counters.agentTasks,
    webSearchQueries: counters.webSearchQueries,
    toolCalls: counters.toolCalls,
    manifestChars: JSON.stringify(fixture.candidates).length,
  });
  assertEqual(proxy, fixture.expected.syntheticWorkProxy, 'pipeline synthetic work proxy');
  return { result, syntheticWorkProxy: proxy, counters };
}

function runRetryableLivenessScenario() {
  const state = createLivenessRoutingState();
  const url = 'https://jobs.synthetic.test/retryable';
  const results = [
    { result: 'uncertain', code: 'navigation_error', reason: 'synthetic timeout' },
    { result: 'active', code: 'apply_control_visible', reason: 'synthetic retry succeeded' },
  ];
  let attempts = 0;
  let routed;
  do {
    routed = routeRetryableLiveness(url, results[attempts], { state, maxAttempts: 2 });
    attempts += 1;
  } while (routed.action === 'retry');
  const terminalUrl = 'https://jobs.synthetic.test/terminal';
  routeRetryableLiveness(terminalUrl, { result: 'expired', code: 'http_404', reason: 'synthetic closed' }, { state });
  const blacklisted = routeRetryableLiveness(terminalUrl, { result: 'active', code: 'apply_control_visible' }, { state });
  return routed.result.result === 'active'
    && attempts === 2
    && state.persisted.get(url)?.result === 'active'
    && !state.blacklist.has(url)
    && blacklisted.action === 'blacklist'
    ? 'retryable-not-blacklisted'
    : 'terminal-blacklist';
}

function withTempRoot(callback) {
  const root = mkdtempSync(join(tmpdir(), 'career-ops-benchmark-'));
  try {
    return callback(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runCopiedNodeScript(root, scriptName) {
  const result = spawnSync(process.execPath, [join(root, scriptName)], { cwd: root, encoding: 'utf8' });
  return { status: result.status ?? 1, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

function prepareTrackerScriptRoot(root, scriptName) {
  mkdirSync(join(root, 'data'), { recursive: true });
  mkdirSync(join(root, 'batch', 'tracker-additions'), { recursive: true });
  cpSync(join(ROOT, scriptName), join(root, scriptName));
  cpSync(join(ROOT, 'tracker-core.mjs'), join(root, 'tracker-core.mjs'));
}

export function observeMalformedAddition({ runScript = runCopiedNodeScript } = {}) {
  return withTempRoot((root) => {
    prepareTrackerScriptRoot(root, 'merge-tracker.mjs');
    const original = readFileSync(join(FIXTURE_ROOT, 'tracker-small.md'), 'utf8');
    writeFileSync(join(root, 'data', 'applications.md'), original);
    const addition = '251\t2026-01-01\tSynthetic Company\tSynthetic Role\tEvaluated\t4.0\t—';
    writeFileSync(join(root, 'batch', 'tracker-additions', 'malformed.tsv'), addition);
    const subprocess = runScript(root, 'merge-tracker.mjs');
    if (subprocess.status !== 0) return `subprocess-failed:${subprocess.status}`;
    if (!subprocess.output.includes('Skipping malformed TSV malformed.tsv')) return 'subprocess-output-missing';
    const pending = existsSync(join(root, 'batch', 'tracker-additions', 'malformed.tsv'));
    const archived = existsSync(join(root, 'batch', 'tracker-additions', 'merged', 'malformed.tsv'));
    return pending && !archived ? 'pending-not-archived' : 'archived-malformed-addition';
  });
}

function observeTrackerFailure() {
  const original = readFileSync(join(FIXTURE_ROOT, 'tracker-duplicates.md'), 'utf8');
  const parsed = parseTrackerRows(original);
  let bytes = original;
  let writes = 0;
  const result = commitText({
    read: () => bytes,
    write: (next) => {
      bytes = next;
      writes += 1;
      if (writes === 1) throw new Error('injected commit failure');
    },
    expected: original,
    next: `${original}\n${parsed.rows[0].raw}`,
  });
  return result.status === 'failed'
    && bytes === original
    && trackerTransform(bytes).rows === trackerTransform(original).rows
    ? 'unchanged-or-recoverable'
    : 'partial-or-unrecoverable';
}

function observeDedupProvenance() {
  return withTempRoot((root) => {
    prepareTrackerScriptRoot(root, 'dedup-tracker.mjs');
    const original = readFileSync(join(FIXTURE_ROOT, 'tracker-duplicates.md'), 'utf8');
    writeFileSync(join(root, 'data', 'applications.md'), original);
    runCopiedNodeScript(root, 'dedup-tracker.mjs');
    const output = readFileSync(join(root, 'data', 'applications.md'), 'utf8');
    const rows = parseTrackerRows(output).rows;
    const keeper = rows.find((row) => row.number === 1);
    const fields = keeper?.fields ?? [];
    return rows.length === 1
      && fields[4] === '4.0'
      && fields[5] === 'Evaluated'
      && fields[6] === '—'
      && fields[7] === '[1](reports/1-synthetic.md)'
      && fields[8] === 'okay'
      ? 'notes-reports-pdf-status-preserved'
      : 'provenance-lost';
  });
}

function observeConcurrentWriters() {
  const original = readFileSync(join(FIXTURE_ROOT, 'tracker-small.md'), 'utf8');
  const nextA = `${original.trimEnd()}\n| 251 | 2026-01-01 | Writer A | Synthetic Role A | 4.0 | Evaluated | — | [251](reports/251.md) | A |`;
  const nextB = `${original.trimEnd()}\n| 252 | 2026-01-01 | Writer B | Synthetic Role B | 4.0 | Evaluated | — | [252](reports/252.md) | B |`;
  if (!trackerTransform(nextA).valid || !trackerTransform(nextB).valid) return 'invalid-writer-fixture';
  let bytes = original;
  const write = (next) => { bytes = next; };
  const first = commitText({ read: () => bytes, write, expected: original, next: nextA });
  const second = commitText({ read: () => bytes, write, expected: original, next: nextB });
  return first.status === 'committed' && second.status === 'conflict' && bytes === nextA
    ? 'no-overwrite-or-duplicate'
    : 'overwrite-or-duplicate';
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
      observed: observeConcurrentWriters(),
    }],
    ['parallel-reserved-ids', {
      workload: 'tracker-250',
      observed: 'production-reservation-unavailable',
    }],
    ['same-batch-reconciliation', {
      workload: 'local-scan-pipeline',
      observed: pipelineRun.result.accepted.length === 3 && pipelineRun.result.rejected.some((entry) => entry.code === 'unsupported_provider')
        ? 'later-sees-earlier' : 'batch-not-reconciled',
    }],
    ['malformed-addition', {
      workload: 'tracker-250',
      observed: observeMalformedAddition(),
    }],
    ['tracker-failure-injection', {
      workload: 'tracker-1000',
      observed: observeTrackerFailure(),
    }],
    ['dedup-provenance', {
      workload: 'url-deduplication',
      observed: observeDedupProvenance(),
    }],
  ]);
  const failures = [];
  const failureRecords = [];
  const byWorkload = Object.fromEntries(WORKLOADS.map((name) => [name, 0]));
  const checksByWorkload = Object.fromEntries(WORKLOADS.map((name) => [name, 0]));
  for (const check of fixture.checks) {
    const observation = observations.get(check.id);
    const workload = observation?.workload ?? check.workload;
    if (!WORKLOADS.includes(workload)) throw new Error(`reliability check ${check.id} has no expected workload`);
    checksByWorkload[workload] += 1;
    if (!observation || observation.observed !== check.expected) {
      const record = {
        id: check.id,
        workload,
        expected: check.expected,
        observed: observation?.observed ?? 'missing',
      };
      failureRecords.push(record);
      failures.push(check.id);
      byWorkload[workload] += 1;
    }
  }
  const knownFailuresByWorkload = Object.fromEntries(
    WORKLOADS.map((name) => [name, failureRecords.filter((failure) => failure.workload === name).map((failure) => failure.id)]),
  );
  const observed = Object.fromEntries([...observations].map(([id, value]) => [id, value.observed]));
  const expected = Object.fromEntries(fixture.checks.map((check) => [check.id, check.expected]));
  return {
    status: failures.length > 0 ? 'KNOWN_FAILURES' : 'PASS',
    exitMode: 'record-only',
    failures,
    knownFailures: failures,
    failureRecords,
    knownFailuresByWorkload,
    byWorkload,
    checksByWorkload,
    expected,
    observations: observed,
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
  const lines = [`# Deterministic scan pipeline benchmark`, '', `- Fixture version: ${artifact.fixtureVersion}`, `- Node: ${artifact.environment.node}`, `- OS: ${artifact.environment.platform} ${artifact.environment.release}`, `- Warmups: ${artifact.policy.warmups}`, `- Measured iterations: ${artifact.policy.iterations}`, `- Token telemetry: ${artifact.telemetry.token_usage}`, `- Reliability state: ${artifact.reliability.status}`, `- Reliability exit mode: ${artifact.reliability.exitMode}`, '', '| Workload | Median | p95 | Min | Max | Stddev | Reliability status | Failures |', '|---|---:|---:|---:|---:|---:|---:|---:|'];
  for (const [name, workload] of Object.entries(artifact.workloads)) {
    const stats = workload.timing.stats;
    lines.push(`| ${name} | ${formatMs(stats.median)} | ${formatMs(stats.p95)} | ${formatMs(stats.min)} | ${formatMs(stats.max)} | ${formatMs(stats.stddev)} | ${workload.reliability.status} | ${workload.reliability.failures} |`);
  }
  lines.push('', '## Synthetic work proxy (fixture instrumentation; actual agent/tool telemetry unavailable)', '', '| Workload | Source | Accepted | Duplicate drops | Liveness calls | Evaluation candidates | Agent tasks | WebSearch queries | Tool calls | Manifest chars |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const [name, workload] of Object.entries(artifact.workloads)) {
    const proxy = workload.syntheticWorkProxy;
    lines.push(`| ${name} | ${proxy.sourceRecords} | ${proxy.acceptedRecords} | ${proxy.duplicateDrops} | ${proxy.livenessCalls} | ${proxy.evaluationCandidates} | ${proxy.agentTasks} | ${proxy.webSearchQueries} | ${proxy.toolCalls} | ${proxy.manifestChars} |`);
  }
  if (artifact.reliability.knownFailures.length > 0) {
    lines.push('', '## Known reliability failures', '', ...artifact.reliability.knownFailures.map((failure) => `- ${failure}`));
  }
  lines.push('', 'Token usage and actual agent/tool telemetry are unavailable. Synthetic work proxy counters are fixture instrumentation, not production calls or token telemetry.', '');
  return lines.join('\n');
}

export function runBenchmark({ warmups = DEFAULT_WARMUPS, iterations = DEFAULT_ITERATIONS, failOnReliability = false } = {}) {
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
    'provider-normalization': providerRun.syntheticWorkProxy,
    'url-deduplication': dedupRun.syntheticWorkProxy,
    'liveness-classification': livenessRun.syntheticWorkProxy,
    'tracker-250': syntheticWorkProxy({ sourceRecords: trackerRun.results.small.rows, acceptedRecords: trackerRun.results.small.rows }),
    'tracker-1000': syntheticWorkProxy({ sourceRecords: trackerRun.results.medium.rows, acceptedRecords: trackerRun.results.medium.rows }),
    'tracker-5000': syntheticWorkProxy({ sourceRecords: trackerRun.results.large.rows, acceptedRecords: trackerRun.results.large.rows }),
    'local-scan-pipeline': pipelineRun.syntheticWorkProxy,
  };
  const workloads = {};
  for (const name of WORKLOADS) {
    const knownFailures = reliability.knownFailuresByWorkload[name];
    if (!Array.isArray(knownFailures)) throw new Error(`missing reliability workload association for ${name}`);
    workloads[name] = {
      fixtureVersion: FIXTURE_VERSION,
      targeted: false,
      targetedMetric: name === 'local-scan-pipeline' ? 'evaluationCandidates and livenessCalls' : null,
      timing: measure(name, operations[name], { warmups, iterations }),
      reliability: {
        status: knownFailures.length > 0 ? 'KNOWN_FAILURES' : 'PASS',
        failures: knownFailures.length,
        checks: reliability.checksByWorkload[name],
        knownFailures,
      },
      syntheticWorkProxy: proxies[name],
    };
  }
  return {
    schemaVersion: BENCHMARK_VERSION,
    benchmark: 'deterministic-scan-pipeline',
    fixtureVersion: FIXTURE_VERSION,
    network: 'none',
    environment: { node: process.version, nodeMajor: Number(process.versions.node.split('.')[0]), platform: process.platform, arch: arch(), release: release(), commit: gitSha() },
    policy: {
      warmups,
      iterations,
      timer: 'performance.now',
      percentile: 'nearest-rank',
      measuredFields: ['timing.stats'],
      reliabilityExitMode: failOnReliability ? 'fail-on-reliability' : 'record-only',
    },
    command: `npm run benchmark -- --warmups=${warmups} --iterations=${iterations}${failOnReliability ? ' --fail-on-reliability' : ''}`,
    telemetry: { token_usage: 'unavailable', agent_tool_telemetry: 'unavailable', note: 'actual agent/tool telemetry unavailable; syntheticWorkProxy is fixture instrumentation' },
    reliability: {
      status: reliability.status,
      exitMode: failOnReliability ? 'fail-on-reliability' : reliability.exitMode,
      failures: reliability.failures,
      knownFailures: reliability.knownFailures,
      expected: reliability.expected,
      observations: reliability.observations,
      failureRecords: reliability.failureRecords,
    },
    workloads,
  };
}

function parseArgs(argv) {
  const options = { warmups: DEFAULT_WARMUPS, iterations: DEFAULT_ITERATIONS, failOnReliability: false, output: join(ARTIFACT_ROOT, 'baseline.json'), markdown: join(ARTIFACT_ROOT, 'baseline.md') };
  for (const arg of argv) {
    const match = arg.match(/^--(warmups|iterations)=(\d+)$/);
    if (match) options[match[1]] = Number(match[2]);
    else if (arg === '--fail-on-reliability') options.failOnReliability = true;
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
  console.log(`Fixture ${artifact.fixtureVersion}; ${artifact.policy.warmups} warmups; ${artifact.policy.iterations} measured iterations; token_usage: unavailable; reliability: ${artifact.reliability.status} (${artifact.reliability.failures.length} observed failures; exit mode ${artifact.reliability.exitMode})`);
  for (const [name, workload] of Object.entries(artifact.workloads)) console.log(`${name}: median ${formatMs(workload.timing.stats.median)}, p95 ${formatMs(workload.timing.stats.p95)}, reliability ${workload.reliability.status} (${workload.reliability.failures} failures)`);
  if (artifact.reliability.failures.length > 0) console.log(`Known reliability failure IDs: ${artifact.reliability.failures.join(', ')}`);
  if (options.failOnReliability && artifact.reliability.failures.length > 0) process.exitCode = 1;
  return artifact;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error(`Benchmark failed: ${error.message}`); process.exitCode = 1; }
}
