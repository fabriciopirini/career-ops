import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareArtifacts } from '../benchmark/compare.mjs';
import { FIXTURE_VERSION, DEFAULT_ITERATIONS, DEFAULT_WARMUPS, deduplicateUrls, measure, normalizeProviderJobs, runBenchmark, trackerTransform } from '../benchmark/run-baseline.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const FIXTURES = join(ROOT, 'benchmark', 'fixtures');
const json = (file) => JSON.parse(readFileSync(join(FIXTURES, file), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));

const requiredFixtureFiles = [
  'provider-jobs.json',
  'liveness-cases.json',
  'tracker-small.md',
  'tracker-medium.md',
  'tracker-large.md',
  'tracker-malformed.md',
  'tracker-duplicates.md',
  'tracker-status-conflict.md',
  'pipeline-candidates.json',
  'expected/provider.json',
  'expected/liveness.json',
  'expected/tracker.json',
  'expected/pipeline.json',
  'expected/reliability.json',
];

test('fixture manifest is synthetic, versioned, and complete', () => {
  const manifest = json('manifest.json');
  assert.equal(manifest.fixtureVersion, FIXTURE_VERSION);
  assert.equal(manifest.syntheticOnly, true);
  assert.equal(manifest.network, 'none');
  for (const file of requiredFixtureFiles) {
    assert.ok(manifest.files.includes(file), `manifest missing ${file}`);
    assert.doesNotThrow(() => readFileSync(join(FIXTURES, file)));
  }
});

test('provider fixture has exact accepted and rejected records', () => {
  const fixture = json('provider-jobs.json');
  const result = normalizeProviderJobs(fixture.records, fixture.config);
  assert.deepEqual(result, fixture.expected);
  assert.equal(new Set(result.accepted.filter((job) => job.title === 'Senior Frontend Engineer').map((job) => job.url)).size, 3);
});

test('URL dedup fixture canonicalizes variants and preserves distinct jobs', () => {
  const provider = json('provider-jobs.json');
  const pipeline = json('pipeline-candidates.json');
  const result = deduplicateUrls(normalizeProviderJobs(provider.records, provider.config).accepted, pipeline.seenUrls);
  assert.deepEqual(result, pipeline.expected.dedup);
});

test('liveness fixture covers exact classifier outcomes including retryable timeout', () => {
  const fixture = json('liveness-cases.json');
  const artifact = runBenchmark({ warmups: 1, iterations: 1 });
  assert.equal(artifact.workloads['liveness-classification'].reliability.failures, 0);
  assert.equal(fixture.expected.filter((entry) => entry.result === 'uncertain').length, 2);
});

test('tracker documents contain required scale and exact failure fixtures', () => {
  const fixture = json('tracker-fixtures.json');
  assert.equal(trackerTransform(readFileSync(join(FIXTURES, fixture.documents.small), 'utf8')).rows, 250);
  assert.equal(trackerTransform(readFileSync(join(FIXTURES, fixture.documents.medium), 'utf8')).rows, 1000);
  assert.equal(trackerTransform(readFileSync(join(FIXTURES, fixture.documents.large), 'utf8')).rows, 5000);
  for (const name of ['malformed', 'duplicates', 'statusConflict']) {
    const actual = trackerTransform(readFileSync(join(FIXTURES, fixture.documents[name]), 'utf8'));
    assert.deepEqual({ rows: actual.rows, valid: actual.valid, errors: actual.errors }, fixture.expected[name]);
  }
});

test('benchmark summaries use measured samples and expose required statistics', () => {
  const summary = measure('deterministic', () => {}, { warmups: 5, iterations: 30 });
  assert.equal(summary.warmups, 5);
  assert.equal(summary.iterations, 30);
  for (const key of ['median', 'p95', 'min', 'max', 'stddev']) assert.equal(typeof summary.stats[key], 'number');
  assert.ok(summary.stats.min >= 0);
  assert.ok(summary.stats.max >= summary.stats.min);
});

test('benchmark artifact contains speed, reliability, work proxy, and unavailable telemetry', () => {
  const artifact = runBenchmark({ warmups: DEFAULT_WARMUPS, iterations: DEFAULT_ITERATIONS });
  assert.equal(artifact.fixtureVersion, FIXTURE_VERSION);
  assert.equal(artifact.network, 'none');
  assert.equal(artifact.policy.warmups, DEFAULT_WARMUPS);
  assert.equal(artifact.policy.iterations, DEFAULT_ITERATIONS);
  assert.equal(artifact.telemetry.token_usage, 'unavailable');
  for (const workload of Object.values(artifact.workloads)) {
    for (const key of ['median', 'p95', 'min', 'max', 'stddev']) assert.equal(typeof workload.timing.stats[key], 'number');
    assert.equal(workload.reliability.failures, 0);
    for (const key of ['sourceRecords', 'acceptedRecords', 'duplicateDrops', 'livenessCalls', 'evaluationCandidates', 'agentTasks', 'toolCalls', 'manifestChars']) assert.equal(typeof workload.workProxy[key], 'number');
  }
});

test('comparison self-compare passes with zero deltas', () => {
  const artifact = runBenchmark({ warmups: 1, iterations: 3 });
  const result = compareArtifacts(artifact, artifact);
  assert.equal(result.pass, true);
  assert.deepEqual(result.failures, []);
  for (const workload of Object.values(result.workloads)) {
    assert.equal(workload.median.absolute, 0);
    assert.equal(workload.p95.absolute, 0);
  }
  assert.equal(result.tokenUsage.status, 'unavailable');
});

test('comparison accepts an improved targeted candidate with unchanged work proxy', () => {
  const baseline = runBenchmark({ warmups: 1, iterations: 3 });
  const candidate = clone(baseline);
  const workload = candidate.workloads['local-scan-pipeline'];
  workload.claimsImprovement = true;
  workload.timing.stats.median = baseline.workloads['local-scan-pipeline'].timing.stats.median * 0.8;
  workload.timing.stats.p95 = baseline.workloads['local-scan-pipeline'].timing.stats.p95 * 0.8;
  const result = compareArtifacts(baseline, candidate);
  assert.equal(result.pass, true);
  assert.equal(result.workloads['local-scan-pipeline'].gates.targetedImprovement, true);
});

test('comparison rejects a latency regression over ten percent', () => {
  const baseline = runBenchmark({ warmups: 1, iterations: 3 });
  const candidate = clone(baseline);
  candidate.workloads['provider-normalization'].timing.stats.median = baseline.workloads['provider-normalization'].timing.stats.median * 1.2 + 0.001;
  candidate.workloads['provider-normalization'].timing.stats.p95 = baseline.workloads['provider-normalization'].timing.stats.p95 * 1.2 + 0.001;
  const result = compareArtifacts(baseline, candidate);
  assert.equal(result.pass, false);
  assert.ok(result.failures.some((failure) => failure.includes('latency regression')));
});

test('comparison rejects increased evaluation work and reliability failures', () => {
  const baseline = runBenchmark({ warmups: 1, iterations: 3 });
  const candidate = clone(baseline);
  candidate.workloads['local-scan-pipeline'].workProxy.evaluationCandidates += 1;
  candidate.workloads['local-scan-pipeline'].reliability.failures = 1;
  const result = compareArtifacts(baseline, candidate);
  assert.equal(result.pass, false);
  assert.ok(result.failures.some((failure) => failure.includes('reliability')));
  assert.ok(result.failures.some((failure) => failure.includes('work proxy')));
});

test('comparison rejects fixture, Node, policy, workload, and network mismatches', () => {
  const baseline = runBenchmark({ warmups: 1, iterations: 1 });
  for (const mutate of [
    (artifact) => { artifact.fixtureVersion = '9.9.9'; },
    (artifact) => { artifact.environment.nodeMajor += 1; },
    (artifact) => { artifact.policy.iterations += 1; },
    (artifact) => { delete artifact.workloads['url-deduplication']; },
    (artifact) => { artifact.network = 'live'; },
  ]) {
    const candidate = clone(baseline);
    mutate(candidate);
    assert.throws(() => compareArtifacts(baseline, candidate));
  }
});
