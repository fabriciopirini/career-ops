#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_REGRESSION = 0.10;
const REQUIRED_POLICY = ['warmups', 'iterations', 'timer', 'percentile'];

function readArtifact(path) {
  try { return JSON.parse(readFileSync(resolve(path), 'utf8')); }
  catch (error) { throw new Error(`cannot read benchmark artifact ${path}: ${error.message}`); }
}

function numeric(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number`);
  return value;
}

function delta(before, after) {
  const absolute = after - before;
  return { absolute, percentage: before === 0 ? (after === 0 ? 0 : null) : (absolute / before) * 100 };
}

function requireCompatible(baseline, candidate) {
  if (baseline.network !== 'none' || candidate.network !== 'none') throw new Error('comparison accepts deterministic artifacts only; live-network runs are not release gates');
  if (baseline.fixtureVersion !== candidate.fixtureVersion) throw new Error(`fixture version mismatch: ${baseline.fixtureVersion} vs ${candidate.fixtureVersion}`);
  if (baseline.schemaVersion !== candidate.schemaVersion) throw new Error(`benchmark schema mismatch: ${baseline.schemaVersion} vs ${candidate.schemaVersion}`);
  if (baseline.environment?.platform !== candidate.environment?.platform) throw new Error(`platform mismatch: ${baseline.environment?.platform} vs ${candidate.environment?.platform}`);
  if (baseline.environment?.arch !== candidate.environment?.arch) throw new Error(`architecture mismatch: ${baseline.environment?.arch} vs ${candidate.environment?.arch}`);
  if (baseline.environment?.release !== candidate.environment?.release) throw new Error(`OS release mismatch: ${baseline.environment?.release} vs ${candidate.environment?.release}`);
  if (baseline.environment?.nodeMajor !== candidate.environment?.nodeMajor) throw new Error(`Node major version mismatch: ${baseline.environment?.nodeMajor} vs ${candidate.environment?.nodeMajor}`);
  for (const field of REQUIRED_POLICY) {
    if (baseline.policy?.[field] !== candidate.policy?.[field]) throw new Error(`iteration policy mismatch at ${field}: ${baseline.policy?.[field]} vs ${candidate.policy?.[field]}`);
  }
  if (JSON.stringify(baseline.policy?.measuredFields ?? []) !== JSON.stringify(candidate.policy?.measuredFields ?? [])) throw new Error('iteration policy mismatch at measuredFields');
  const beforeNames = Object.keys(baseline.workloads ?? {}).sort();
  const afterNames = Object.keys(candidate.workloads ?? {}).sort();
  if (JSON.stringify(beforeNames) !== JSON.stringify(afterNames)) throw new Error('workload set mismatch');
}

export function compareArtifacts(baseline, candidate) {
  requireCompatible(baseline, candidate);
  const workloads = {};
  const failures = [];
  const candidateReliabilityFailures = Array.isArray(candidate.reliability?.failures) ? candidate.reliability.failures : [];
  if (candidateReliabilityFailures.length) failures.push(`global reliability failures after=${candidateReliabilityFailures.length}`);
  for (const name of Object.keys(baseline.workloads).sort()) {
    const before = baseline.workloads[name];
    const after = candidate.workloads[name];
    const medianBefore = numeric(before.timing?.stats?.median, `${name} baseline median`);
    const medianAfter = numeric(after.timing?.stats?.median, `${name} candidate median`);
    const p95Before = numeric(before.timing?.stats?.p95, `${name} baseline p95`);
    const p95After = numeric(after.timing?.stats?.p95, `${name} candidate p95`);
    const median = delta(medianBefore, medianAfter);
    const p95 = delta(p95Before, p95After);
    const beforeReliability = Number(before.reliability?.failures ?? 0);
    const afterReliability = Number(after.reliability?.failures ?? 0);
    const proxyKeys = new Set([...Object.keys(before.workProxy ?? {}), ...Object.keys(after.workProxy ?? {})]);
    const workProxy = {};
    for (const key of [...proxyKeys].sort()) {
      const beforeValue = numeric(before.workProxy?.[key] ?? 0, `${name} baseline proxy ${key}`);
      const afterValue = numeric(after.workProxy?.[key] ?? 0, `${name} candidate proxy ${key}`);
      workProxy[key] = { before: beforeValue, after: afterValue, ...delta(beforeValue, afterValue) };
    }
    const reliabilityPass = afterReliability === 0;
    const unaffectedSpeedPass = median.percentage === null || median.percentage <= MAX_REGRESSION * 100;
    const p95SpeedPass = p95.percentage === null || p95.percentage <= MAX_REGRESSION * 100;
    const taskPass = ['evaluationCandidates', 'agentTasks', 'livenessCalls'].every((key) => (workProxy[key]?.after ?? 0) <= (workProxy[key]?.before ?? 0));
    const targetedPass = !after.claimsImprovement || (median.percentage !== null && p95.percentage !== null && median.percentage < 0 && p95.percentage < 0);
    if (!reliabilityPass) failures.push(`${name}: reliability failures after=${afterReliability}`);
    if (!unaffectedSpeedPass || !p95SpeedPass) failures.push(`${name}: local latency regression exceeds 10%`);
    if (!taskPass) failures.push(`${name}: evaluation/liveness work proxy increased`);
    if (!targetedPass) failures.push(`${name}: targeted workload did not improve both median and p95`);
    workloads[name] = {
      median,
      p95,
      reliability: { before: beforeReliability, after: afterReliability, pass: reliabilityPass },
      workProxy,
      gates: { reliability: reliabilityPass, speedMedian: unaffectedSpeedPass, speedP95: p95SpeedPass, agentWork: taskPass, targetedImprovement: targetedPass },
    };
  }
  const beforeTelemetry = baseline.telemetry?.token_usage;
  const afterTelemetry = candidate.telemetry?.token_usage;
  let tokenUsage = { status: 'unavailable' };
  if (beforeTelemetry && afterTelemetry && beforeTelemetry !== 'unavailable' && afterTelemetry !== 'unavailable') {
    const beforeInput = numeric(baseline.telemetry.input_tokens, 'baseline input_tokens');
    const afterInput = numeric(candidate.telemetry.input_tokens, 'candidate input_tokens');
    const beforeOutput = numeric(baseline.telemetry.output_tokens, 'baseline output_tokens');
    const afterOutput = numeric(candidate.telemetry.output_tokens, 'candidate output_tokens');
    tokenUsage = { status: 'available', input: delta(beforeInput, afterInput), output: delta(beforeOutput, afterOutput) };
  }
  return { pass: failures.length === 0, failures, fixtureVersion: baseline.fixtureVersion, workloads, tokenUsage };
}

function formatDelta(value) {
  const percentage = value.percentage === null ? 'n/a' : `${value.percentage.toFixed(2)}%`;
  return `${value.absolute.toFixed(3)} ms (${percentage})`;
}

export function renderComparison(result) {
  const lines = [`Fixture version: ${result.fixtureVersion}`, `Overall: ${result.pass ? 'PASS' : 'FAIL'}`, ''];
  for (const [name, workload] of Object.entries(result.workloads)) {
    lines.push(`${name}: median ${formatDelta(workload.median)}; p95 ${formatDelta(workload.p95)}; reliability ${workload.reliability.before} -> ${workload.reliability.after}; ${workload.gates.reliability && workload.gates.speedMedian && workload.gates.speedP95 && workload.gates.agentWork && workload.gates.targetedImprovement ? 'PASS' : 'FAIL'}`);
    for (const [key, change] of Object.entries(workload.workProxy)) lines.push(`  work-proxy ${key}: ${change.before} -> ${change.after} (${change.absolute >= 0 ? '+' : ''}${change.absolute})`);
  }
  if (result.tokenUsage.status === 'available') lines.push(`Actual token telemetry: input ${formatDelta(result.tokenUsage.input)}; output ${formatDelta(result.tokenUsage.output)}`);
  else lines.push('Actual token telemetry: unavailable; work proxy is not tokens.');
  if (result.failures.length) lines.push('', 'Failures:', ...result.failures.map((failure) => `- ${failure}`));
  return `${lines.join('\n')}\n`;
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv.some((arg) => arg.startsWith('--'))) throw new Error('usage: node benchmark/compare.mjs baseline.json candidate.json');
  const result = compareArtifacts(readArtifact(argv[0]), readArtifact(argv[1]));
  process.stdout.write(renderComparison(result));
  if (!result.pass) process.exitCode = 1;
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error(`Benchmark comparison rejected: ${error.message}`); process.exitCode = 2; }
}
