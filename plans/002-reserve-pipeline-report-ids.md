# Plan 002: Reserve report IDs before parallel pipeline evaluation

> **Executor instructions**: Follow every step and verification gate. Stop on any STOP condition. Do not improvise. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 53953d4..HEAD -- modes/pipeline.md reports batch scripts package.json test`
> If report naming, Pending row syntax, or batch layout changed, compare live behavior with Current state before proceeding.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-verification-baseline.md`
- **Category**: correctness
- **Planned at**: commit `53953d4`, 2026-07-20

## Why this matters

Pipeline mode computes `max report number + 1` while also requiring three or more jobs to run in parallel. Two workers can select the same number and overwrite reports or tracker additions. Allocation must happen once, before dispatch, with durable reservations that survive retries.

## Benchmark gate

Before editing, run `npm run benchmark -- --iterations=30` and preserve the JSON/Markdown baseline artifact. After editing, run `npm run benchmark:compare -- <baseline.json> <candidate.json>` with the same fixture version and iteration policy. The reservation fixture must report zero ID collisions and zero duplicate manifests; evaluation-candidate, agent-task, liveness-call, and tool-call work proxies must not increase. Report median and p95 latency; no more than 10% regression on unaffected local workloads.

## Current state

- `modes/pipeline.md:7-14` tells each pending worker to calculate the next report number and process jobs in parallel.
- `modes/pipeline.md:55-59` defines allocation as listing `reports/` and taking maximum plus one.
- `modes/pipeline.md:69-80` embeds that number in tracker filename, tracker ID, report-link label, and report filename.
- Tracker IDs may differ from report IDs after `merge-tracker.mjs` collision renumbering. This plan prevents new collisions; it does not rewrite historical rows.
- New scripts use ESM `.mjs`, `node:` built-ins, repository-relative paths from `import.meta.url`, and no shell string execution.

Reservation contract:

```json
{
  "version": 1,
  "runId": "2026-07-20T12-34-56-000Z",
  "createdAt": "ISO timestamp",
  "jobs": [
    { "pipelineLine": 12, "url": "https://...", "reportId": 295, "state": "reserved" }
  ]
}
```

A reservation is active until its report exists and state becomes `committed`, or an operator explicitly abandons the run. IDs in active manifests count as occupied.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Syntax | `node --check scripts/prepare-pipeline-batch.mjs` | exit 0 |
| Tests | `node --test test/prepare-pipeline-batch.test.mjs` | all pass |
| Dry run | `node scripts/prepare-pipeline-batch.mjs --dry-run` | JSON preview, no writes |
| Full verification | `npm test && npm run verify` | exit 0 |

## Scope

**In scope**:
- `scripts/prepare-pipeline-batch.mjs` (create)
- `lib/report-reservations.mjs` (create)
- `test/prepare-pipeline-batch.test.mjs` (create)
- `modes/pipeline.md`
- `.gitignore` only if reservation manifests are not already ignored
- `package.json` only to add a `pipeline:prepare` command
- `plans/README.md`

**Out of scope**:
- JD extraction and qualitative evaluation.
- Report content or PDF generation.
- Tracker merge internals.
- Renumbering historical reports or tracker entries.
- Submitting applications.

## Git workflow

- Branch: `advisor/002-report-reservations`
- Commit message example: `Reserve pipeline report IDs before dispatch`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Implement pure allocation logic

Create `lib/report-reservations.mjs` with named exports:

- `parsePendingPipeline(text)`: parse only `- [ ]` rows under `## Pending`; return URL, optional company/title, and original line number. Reject duplicate URLs and malformed non-HTTP(S) URLs.
- `collectOccupiedReportIds(reportNames, activeManifests)`: collect numeric report prefixes plus every non-abandoned reservation.
- `allocateReportIds(pending, occupied)`: allocate ascending unused positive integers. Allocation must be deterministic in pipeline order.
- `validateReservationManifest(manifest)`: require version, unique URLs, unique report IDs, valid state, and valid timestamps.

No filesystem access in these functions.

**Verify**: `node --check lib/report-reservations.mjs` -> exit 0.

### Step 2: Add atomic preparation CLI

Create `scripts/prepare-pipeline-batch.mjs`:

1. Acquire `batch/.pipeline-reservation.lock` using exclusive create (`wx`).
2. Read `data/pipeline.md`, `reports/`, and existing `batch/pipeline-runs/*.json` while holding the lock.
3. Allocate all pending IDs once.
4. Write a complete manifest to a sibling temporary file, flush/close it, then rename to `batch/pipeline-runs/<runId>.json`.
5. Release lock in `finally`.
6. Print manifest path and a compact table of URL -> reserved report ID.
7. `--dry-run` performs parsing/allocation but creates neither directory, lock, nor manifest.
8. If no Pending rows exist, exit 0 and write nothing.
9. If lock exists, exit nonzero with owner/path guidance. Never delete an existing lock automatically.

Add `"pipeline:prepare": "node scripts/prepare-pipeline-batch.mjs"` to `package.json`.

**Verify**: `node scripts/prepare-pipeline-batch.mjs --dry-run` -> exit 0, no changed files.

### Step 3: Test collisions and retries

Create `test/prepare-pipeline-batch.test.mjs` with temporary directories and dependency injection or subprocess environment paths. Cover:

- Empty Pending section.
- Three pending jobs receive three distinct sequential IDs.
- Existing report prefixes are skipped.
- Active reservations are skipped even when report files do not exist.
- Abandoned reservations may be reused only when explicitly represented as abandoned.
- Duplicate Pending URL rejects whole batch.
- Existing lock rejects second preparer.
- Failure before rename leaves no partial manifest.
- Dry-run writes nothing.
- Rerunning after a manifest exists does not reserve duplicate jobs.

**Verify**: `node --test test/prepare-pipeline-batch.test.mjs` -> all pass.

### Step 4: Update pipeline agent contract

Change `modes/pipeline.md` so coordinator runs `npm run pipeline:prepare` once before spawning agents. Every worker receives its manifest entry and must use `reportId` exactly. Remove instructions telling individual workers to calculate `max + 1`.

Require each worker result to state report path and tracker-addition path. Coordinator must verify both embed the reserved report ID before treating the job as processed. Do not mark the manifest committed here; Plan 003 will commit after tracker merge.

**Verify**: `grep -n "maximum found + 1\|highest number + 1" modes/pipeline.md` -> no matches; `grep -n "pipeline:prepare" modes/pipeline.md` -> at least one match.

## Test plan

Use Node built-in tests only. At least 10 cases listed above. Include a two-process lock contention integration test. Tests must not read or write live `reports/`, `batch/`, or `data/`.

## Done criteria

- [ ] `npm test && npm run verify` exits 0.
- [ ] One preparation call reserves unique IDs for all pending jobs.
- [ ] Concurrent preparation cannot create overlapping reservations.
- [ ] Dry-run changes no files.
- [ ] Pipeline mode contains no per-worker max-plus-one allocation.
- [ ] No historical reports or tracker rows changed.

## STOP conditions

- `batch/` is not permitted to hold ignored runtime reservation state.
- Another process already owns the reservation lock.
- Current report filenames contain nonnumeric identities that cannot be safely interpreted.
- Existing active manifests contain duplicate IDs or malformed state. Report them; do not auto-repair.

## Maintenance notes

Reservations are operational state. Never infer vacancy solely from missing report files. Review manifest state transitions whenever pipeline completion behavior changes. A later resumable pipeline CLI can reuse this contract rather than inventing another ID allocator.