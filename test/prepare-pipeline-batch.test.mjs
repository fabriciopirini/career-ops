import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import {
  allocateReportIds,
  collectOccupiedReportIds,
  parsePendingPipeline,
  validateReservationManifest,
} from '../lib/report-reservations.mjs';
import { preparePipelineBatch } from '../scripts/prepare-pipeline-batch.mjs';

const execFileAsync = promisify(execFile);
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const CLI = join(ROOT, 'scripts', 'prepare-pipeline-batch.mjs');

const URLS = [
  'https://jobs.example.test/one',
  'https://jobs.example.test/two',
  'https://jobs.example.test/three',
];

function pipelineText(rows = URLS.map((url) => `- [ ] ${url}`).join('\n')) {
  return `# Queue\n\n## Pending\n${rows}\n\n## Processed\n- [x] old\n`;
}

async function makeRepo({ rows, reportNames = [], manifests = [], withBatch = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'career-ops-reservations-'));
  await mkdir(join(root, 'data'), { recursive: true });
  await mkdir(join(root, 'reports'), { recursive: true });
  await writeFile(join(root, 'data', 'pipeline.md'), pipelineText(rows), 'utf8');
  for (const name of reportNames) await writeFile(join(root, 'reports', name), '', 'utf8');
  if (withBatch) await mkdir(join(root, 'batch'), { recursive: true });
  if (manifests.length > 0) {
    await mkdir(join(root, 'batch', 'pipeline-runs'), { recursive: true });
    for (const [name, manifest] of manifests) {
      await writeFile(join(root, 'batch', 'pipeline-runs', name), `${JSON.stringify(manifest)}\n`, 'utf8');
    }
  }
  return root;
}

function manifest({ runId = 'run', jobs, state } = {}) {
  return {
    version: 1,
    runId,
    createdAt: '2026-07-21T00:00:00.000Z',
    ...(state ? { state } : {}),
    jobs: jobs.map(({ pipelineLine, url, reportId, state: jobState = 'reserved' }) => ({
      pipelineLine,
      url,
      reportId,
      state: jobState,
    })),
  };
}

async function runCli(root, args = []) {
  return execFileAsync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    env: { ...process.env, CAREER_OPS_ROOT: root, PIPELINE_RUN_ID: '2026-07-21T00-00-00-000Z' },
  });
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

test('parsePendingPipeline returns pending rows with original line and optional metadata only', () => {
  const pending = parsePendingPipeline('# Queue\n\n## Pending\n\n- [ ] https://jobs.example.test/one | Acme | Frontend\n- [x] https://jobs.example.test/done\n\n## Processed\n- [ ] https://jobs.example.test/not-pending\n');
  assert.deepEqual(pending, [{
    url: URLS[0],
    company: 'Acme',
    title: 'Frontend',
    lineNumber: 5,
  }]);
});

test('parsePendingPipeline rejects non-HTTP(S) pending URLs', () => {
  assert.throws(() => parsePendingPipeline('## Pending\n- [ ] local:jds/job.md\n'), /absolute HTTP\(S\) URL/);
});

test('parsePendingPipeline rejects duplicate pending URLs as one batch error', () => {
  assert.throws(() => parsePendingPipeline(`## Pending\n- [ ] ${URLS[0]}\n- [ ] ${URLS[0]}\n`), /duplicate pending URL/);
});

test('empty Pending section performs no writes', async () => {
  const root = await makeRepo({ rows: '' });
  const result = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'empty' });
  assert.equal(result.status, 'empty');
  assert.equal(await pathExists(join(root, 'batch')), false);
});

test('three pending jobs receive distinct sequential IDs in pipeline order', async () => {
  const root = await makeRepo({ rows: URLS.map((url) => `- [ ] ${url}`).join('\n') });
  const result = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'sequential' });
  assert.deepEqual(result.allocations.map(({ url, reportId }) => [url, reportId]), URLS.map((url, index) => [url, index + 1]));
  const saved = JSON.parse(await readFile(join(root, 'batch', 'pipeline-runs', 'sequential.json'), 'utf8'));
  assert.deepEqual(saved.jobs.map(({ url, reportId }) => [url, reportId]), URLS.map((url, index) => [url, index + 1]));
});

test('existing report prefixes are skipped while preserving max-plus-one semantics', async () => {
  const root = await makeRepo({ reportNames: ['001-old.md', '003-old.md'], rows: '- [ ] https://jobs.example.test/new' });
  const result = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'skip-reports' });
  assert.deepEqual(result.allocations.map(({ reportId }) => reportId), [4]);
});

test('active reservations are occupied even when report files do not exist', async () => {
  const root = await makeRepo({
    rows: '- [ ] https://jobs.example.test/new',
    manifests: [['active.json', manifest({ runId: 'active', jobs: [{ pipelineLine: 2, url: URLS[0], reportId: 7 }] })]],
  });
  const result = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'active-skip' });
  assert.deepEqual(result.allocations.map(({ reportId }) => reportId), [8]);
});

test('abandoned reservations may be reused only when explicitly abandoned', async () => {
  const root = await makeRepo({
    reportNames: ['001-old.md', '002-old.md'],
    rows: '- [ ] https://jobs.example.test/new',
    manifests: [['abandoned.json', manifest({ runId: 'abandoned', jobs: [{ pipelineLine: 2, url: URLS[0], reportId: 3, state: 'abandoned' }] })]],
  });
  const result = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'reuse-abandoned' });
  assert.deepEqual(result.allocations.map(({ reportId }) => reportId), [3]);
});

test('retry after a manifest exists reuses URL and writes no duplicate manifest', async () => {
  const root = await makeRepo({ rows: '- [ ] https://jobs.example.test/new' });
  const first = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'first' });
  const second = await preparePipelineBatch({ root, now: new Date('2026-07-21T00:00:01.000Z'), runId: 'second' });
  assert.equal(first.status, 'created');
  assert.equal(second.status, 'existing');
  assert.deepEqual(second.allocations.map(({ reportId }) => reportId), [1]);
  assert.deepEqual((await readdir(join(root, 'batch', 'pipeline-runs'))).sort(), ['first.json']);
});

test('malformed existing manifest fails closed without creating a new reservation', async () => {
  const root = await makeRepo({
    rows: '- [ ] https://jobs.example.test/new',
    manifests: [['bad.json', { version: 1, runId: 'bad', createdAt: 'not-a-date', jobs: [] }]],
  });
  await assert.rejects(() => preparePipelineBatch({ root, runId: 'should-not-write' }), /invalid reservation manifest/);
  assert.deepEqual((await readdir(join(root, 'batch', 'pipeline-runs'))).sort(), ['bad.json']);
});

test('duplicate active IDs across manifests fail closed', async () => {
  const root = await makeRepo({
    rows: '- [ ] https://jobs.example.test/new',
    manifests: [
      ['one.json', manifest({ runId: 'one', jobs: [{ pipelineLine: 2, url: URLS[0], reportId: 4 }] })],
      ['two.json', manifest({ runId: 'two', jobs: [{ pipelineLine: 3, url: URLS[1], reportId: 4 }] })],
    ],
  });
  await assert.rejects(() => preparePipelineBatch({ root, runId: 'should-not-write' }), /report ID appears in multiple manifests/);
});

test('failure before rename cleans temporary manifest and releases lock', async () => {
  const root = await makeRepo({ rows: '- [ ] https://jobs.example.test/new', withBatch: true });
  const runsPath = join(root, 'batch', 'pipeline-runs');
  await mkdir(runsPath, { recursive: true });
  await mkdir(join(runsPath, 'fixed.json'));
  await assert.rejects(() => preparePipelineBatch({ root, runId: 'fixed' }), /cannot atomically write reservation manifest/);
  assert.equal(await pathExists(join(root, 'batch', '.pipeline-reservation.lock')), false);
  assert.deepEqual((await readdir(runsPath)).sort(), ['fixed.json']);
});

test('dry-run emits preview and writes neither lock, directory, nor manifest', async () => {
  const root = await makeRepo({ rows: '- [ ] https://jobs.example.test/new' });
  const result = await preparePipelineBatch({ root, dryRun: true, now: new Date('2026-07-21T00:00:00.000Z'), runId: 'preview' });
  assert.equal(result.status, 'dry-run');
  assert.deepEqual(result.manifest.jobs.map(({ reportId }) => reportId), [1]);
  assert.equal(await pathExists(join(root, 'batch')), false);
});

test('existing reservation lock rejects another preparer without deleting it', async () => {
  const root = await makeRepo({ rows: '- [ ] https://jobs.example.test/new', withBatch: true });
  const lockPath = join(root, 'batch', '.pipeline-reservation.lock');
  await writeFile(lockPath, '{"pid":123}\n', 'utf8');
  await assert.rejects(() => runCli(root), (error) => /reservation lock already exists/.test(error.stderr));
  assert.equal(await readFile(lockPath, 'utf8'), '{"pid":123}\n');
});

test('manifest validator accepts complete states and rejects duplicate fields', () => {
  const valid = manifest({ jobs: [{ pipelineLine: 2, url: URLS[0], reportId: 1, state: 'committed' }] });
  assert.equal(validateReservationManifest(valid), true);
  assert.throws(() => validateReservationManifest({ ...valid, jobs: [{ ...valid.jobs[0], url: URLS[0] }, { ...valid.jobs[0], reportId: 2 }] }), /duplicate URL/);
  assert.deepEqual([...collectOccupiedReportIds(['003-existing.md'], [valid])].sort((a, b) => a - b), [1, 3]);
});

test('allocator returns copied jobs and skips occupied IDs deterministically', () => {
  const pending = [{ url: URLS[0], lineNumber: 2 }, { url: URLS[1], lineNumber: 3 }];
  const result = allocateReportIds(pending, new Set([1, 3]));
  assert.deepEqual(result, [{ ...pending[0], reportId: 4 }, { ...pending[1], reportId: 5 }]);
  assert.deepEqual(pending, [{ url: URLS[0], lineNumber: 2 }, { url: URLS[1], lineNumber: 3 }]);
});
