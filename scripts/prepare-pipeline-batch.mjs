#!/usr/bin/env node

import { open, readdir, readFile, rename, rm, mkdir, rmdir, stat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allocateReportIds,
  collectOccupiedReportIds,
  parsePendingPipeline,
  validateReservationManifest,
} from '../lib/report-reservations.mjs';

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUNS_RELATIVE = join('batch', 'pipeline-runs');
const LOCK_RELATIVE = join('batch', '.pipeline-reservation.lock');

function repositoryRoot(root = process.env.CAREER_OPS_ROOT) {
  return resolve(root || DEFAULT_ROOT);
}

function compactRunId(now = new Date()) {
  return now.toISOString().replaceAll(':', '-').replace('.', '-');
}

function validateRunId(runId) {
  if (typeof runId !== 'string' || runId.length === 0) {
    throw new TypeError('PIPELINE_RUN_ID must be a non-empty safe filename component');
  }
  if (
    runId === '.' ||
    runId === '..' ||
    runId !== runId.trim() ||
    runId.includes('/') ||
    runId.includes('\\') ||
    /[\u0000-\u001f\u007f<>:"|?*]/u.test(runId) ||
    /[. ]$/u.test(runId) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(runId)
  ) {
    throw new TypeError(`PIPELINE_RUN_ID is not a safe filename component: ${runId}`);
  }
  return runId;
}

function randomSuffix() {
  return randomBytes(8).toString('hex');
}

function displayPath(root, path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot || '.';
}

async function readReportNames(reportsPath) {
  let entries;
  try {
    entries = await readdir(reportsPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`cannot read reports directory ${reportsPath}: ${error.message}`, { cause: error });
  }
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

async function readReservationManifests(runsPath) {
  let entries;
  try {
    entries = await readdir(runsPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`cannot read reservation directory ${runsPath}: ${error.message}`, { cause: error });
  }

  const manifests = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const path = join(runsPath, entry.name);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
      throw new Error(`cannot parse reservation manifest ${path}: ${error.message}`, { cause: error });
    }
    try {
      validateReservationManifest(parsed);
    } catch (error) {
      throw new Error(`invalid reservation manifest ${path}: ${error.message}`, { cause: error });
    }
    manifests.push({ path, manifest: parsed });
  }
  return manifests;
}

function activeJobsByKey(manifestRecords) {
  const urls = new Map();
  const reportIds = new Map();
  for (const record of manifestRecords) {
    const { manifest } = record;
    if (manifest.state === 'abandoned') continue;
    for (const job of manifest.jobs) {
      if (job.state === 'abandoned') continue;
      if (urls.has(job.url)) {
        throw new Error(`active reservation URL appears in multiple manifests: ${job.url}`);
      }
      if (reportIds.has(job.reportId)) {
        throw new Error(`active reservation report ID appears in multiple manifests: ${job.reportId}`);
      }
      urls.set(job.url, { ...job, manifestPath: record.path });
      reportIds.set(job.reportId, record.path);
    }
  }
  return { urls, reportIds };
}

function makeManifest({ runId, createdAt, jobs }) {
  const manifest = {
    version: 1,
    runId,
    createdAt,
    jobs: jobs.map(({ lineNumber, url, reportId }) => ({
      pipelineLine: lineNumber,
      url,
      reportId,
      state: 'reserved',
    })),
  };
  validateReservationManifest(manifest);
  return manifest;
}

async function writeManifestAtomically(path, manifest) {
  const temporaryPath = `${path}.${process.pid}.${randomSuffix()}.tmp`;
  let handle;
  try {
    handle = await open(temporaryPath, 'wx');
    await handle.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, path);
    let directoryHandle;
    try {
      directoryHandle = await open(dirname(path), 'r');
      await directoryHandle.sync();
    } finally {
      if (directoryHandle) await directoryHandle.close();
    }
  } catch (error) {
    if (handle) {
      try { await handle.close(); } catch { /* preserve original failure */ }
    }
    try { await rm(temporaryPath, { force: true }); } catch { /* preserve original failure */ }
    throw new Error(`cannot atomically write reservation manifest ${path}: ${error.message}`, { cause: error });
  }
  return path;
}

async function acquireLock(lockPath, runId) {
  let handle;
  let ownsLock = false;
  try {
    handle = await open(lockPath, 'wx');
    ownsLock = true;
    await handle.writeFile(`${JSON.stringify({ pid: process.pid, runId, createdAt: new Date().toISOString() })}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
  } catch (error) {
    if (handle) {
      try { await handle.close(); } catch { /* preserve original failure */ }
    }
    if (ownsLock) {
      try { await rm(lockPath, { force: false }); } catch { /* preserve original failure */ }
    }
    if (error.code === 'EEXIST') {
      throw new Error(`reservation lock already exists at ${lockPath}; inspect its owner and remove it only after confirming no preparation is running`);
    }
    throw new Error(`cannot acquire reservation lock ${lockPath}: ${error.message}`, { cause: error });
  }
}

async function releaseLock(lockPath) {
  await rm(lockPath, { force: false });
}

function printTable(root, manifestPath, jobs, dryRun, manifest) {
  if (dryRun) console.log(JSON.stringify(manifest, null, 2));
  else console.log(`Manifest: ${displayPath(root, manifestPath)}`);
  console.log('URL | reserved report ID');
  for (const job of jobs) console.log(`${job.url} | ${job.reportId}`);
}

/**
 * Prepare one durable reservation manifest. `root` and `now` are injectable so
 * tests can use temporary repositories without touching user-owned data.
 */
export async function preparePipelineBatch({
  root = repositoryRoot(),
  dryRun = false,
  now = new Date(),
  runId = process.env.PIPELINE_RUN_ID || compactRunId(now),
} = {}) {
  validateRunId(runId);
  const repository = resolve(root);
  const pipelinePath = join(repository, 'data', 'pipeline.md');
  const reportsPath = join(repository, 'reports');
  const runsPath = join(repository, RUNS_RELATIVE);
  const lockPath = join(repository, LOCK_RELATIVE);

  const readInputs = async () => {
    const [reportNames, manifestRecords] = await Promise.all([
      readReportNames(reportsPath),
      readReservationManifests(runsPath),
    ]);
    const active = activeJobsByKey(manifestRecords);
    const occupied = collectOccupiedReportIds(reportNames, manifestRecords.map(({ manifest }) => manifest));
    return { reportNames, manifestRecords, active, occupied };
  };

  if (dryRun) {
    const pipelineText = await readFile(pipelinePath, 'utf8');
    const pending = parsePendingPipeline(pipelineText);
    if (pending.length === 0) return { status: 'empty', pending: [], manifest: null };

    const { active, occupied } = await readInputs();
    const newPending = pending.filter((job) => !active.urls.has(job.url));
    const newAllocations = allocateReportIds(newPending, occupied);
    const allocationsByUrl = new Map(newAllocations.map((job) => [job.url, job]));
    const allocations = pending.map((job) => active.urls.get(job.url) ?? allocationsByUrl.get(job.url));
    if (newPending.length === 0) {
      return { status: 'existing', pending, allocations, manifest: null };
    }
    const preview = makeManifest({
      runId,
      createdAt: now.toISOString(),
      jobs: newAllocations,
    });
    return {
      status: 'dry-run',
      pending,
      allocations,
      manifest: preview,
      manifestPath: join(repository, RUNS_RELATIVE, `${runId}.json`),
    };
  }

  const batchPath = join(repository, 'batch');
  let batchExisted;
  try {
    await stat(batchPath);
    batchExisted = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    batchExisted = false;
  }
  await mkdir(batchPath, { recursive: true });
  await acquireLock(lockPath, runId);
  let removeEmptyBatch = false;
  try {
    const pipelineText = await readFile(pipelinePath, 'utf8');
    const pending = parsePendingPipeline(pipelineText);
    if (pending.length === 0) {
      removeEmptyBatch = !batchExisted;
      return { status: 'empty', pending: [], manifest: null };
    }

    const { active, occupied, manifestRecords } = await readInputs();
    const newPending = pending.filter((job) => !active.urls.has(job.url));
    const newAllocations = allocateReportIds(newPending, occupied);
    const allocationsByUrl = new Map(newAllocations.map((job) => [job.url, job]));
    const allocations = pending.map((job) => active.urls.get(job.url) ?? allocationsByUrl.get(job.url));
    if (newPending.length === 0) {
      return { status: 'existing', pending, allocations, manifest: null };
    }

    await mkdir(runsPath, { recursive: true });
    const manifest = makeManifest({ runId, createdAt: now.toISOString(), jobs: newAllocations });
    const manifestPath = join(runsPath, `${runId}.json`);
    if (manifestRecords.some((record) => record.path === manifestPath)) {
      throw new Error(`reservation manifest already exists at ${manifestPath}; choose a new run ID`);
    }
    await writeManifestAtomically(manifestPath, manifest);
    return { status: 'created', pending, allocations, manifest, manifestPath };
  } finally {
    await releaseLock(lockPath);
    if (removeEmptyBatch) {
      try { await rmdir(batchPath); } catch { /* preserve original failure */ }
    }
  }
}

function printResult(root, result, dryRun) {
  if (result.status === 'empty') {
    console.log('No pending pipeline jobs.');
    return;
  }
  if (result.status === 'existing') {
    console.log('Existing reservations:');
    console.log('URL | reserved report ID');
    for (const job of result.allocations) console.log(`${job.url} | ${job.reportId}`);
    return;
  }
  printTable(root, result.manifestPath, result.allocations.map((job) => ({ url: job.url, reportId: job.reportId })), dryRun, result.manifest);
}

function usageError(message) {
  console.error(`prepare-pipeline-batch: ${message}`);
  console.error('Usage: node scripts/prepare-pipeline-batch.mjs [--dry-run]');
  process.exitCode = 1;
}

async function main(argv = process.argv.slice(2)) {
  if (argv.some((arg) => arg === '--help' || arg === '-h')) {
    console.log('Usage: node scripts/prepare-pipeline-batch.mjs [--dry-run]');
    return;
  }
  const unknown = argv.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) return usageError(`unknown option: ${unknown[0]}`);
  const dryRun = argv.includes('--dry-run');
  const root = repositoryRoot();
  try {
    const result = await preparePipelineBatch({ root, dryRun });
    printResult(root, result, dryRun);
  } catch (error) {
    console.error(`prepare-pipeline-batch: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

export {
  acquireLock,
  compactRunId,
  makeManifest,
  readReservationManifests,
  validateRunId,
  writeManifestAtomically,
};
