# Plan 003: Make tracker batch merge coherent, atomic, and fail-closed

> **Executor instructions**: Follow each step and verification command. Stop and report on any STOP condition. Do not improvise. Update this plan's status in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 53953d4..HEAD -- merge-tracker.mjs lib/tracker.mjs lib/report-reservations.mjs test/merge-tracker.test.mjs batch/tracker-additions modes/pipeline.md`
> Plans 001 and 002 intentionally change some paths. Confirm their contracts exist before proceeding.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-verification-baseline.md`, `plans/002-reserve-pipeline-report-ids.md`
- **Category**: correctness
- **Planned at**: commit `53953d4`, 2026-07-20

## Why this matters

Current merge reads existing applications once, then reconciles every addition against that stale snapshot. New additions are not visible to later additions, malformed files are archived anyway, and verification runs after mutation through an absent verifier. A batch must either validate and commit coherently or leave tracker and queue untouched.

## Benchmark gate

Before editing, run `npm run benchmark -- --iterations=30` and preserve the JSON/Markdown baseline artifact. After editing, run `npm run benchmark:compare -- <baseline.json> <candidate.json>` with the same fixture version and iteration policy. Merge reliability must report zero invariant failures across failure-injection fixtures and malformed input must remain pending, not archived. Report median and p95 local merge latency; no more than 10% regression on unaffected local workloads. Token claims require provider telemetry; otherwise report labeled work-proxy deltas only.

## Current state

- `merge-tracker.mjs:314-317` parses files individually and continues after malformed input.
- `merge-tracker.mjs:319-345` searches only the original `existingApps` array.
- `merge-tracker.mjs:347-359` can update a row using stale `duplicate.raw`; a second update may silently miss it.
- `merge-tracker.mjs:363-369` queues new lines but never adds them to `existingApps`; collision renumbering changes tracker ID without changing report identity.
- `merge-tracker.mjs:390-399` writes tracker, then moves every input file, including skipped/malformed files.
- `merge-tracker.mjs:405-412` verifies only after mutation.
- Plan 001 provides `lib/tracker.mjs` and `verify-pipeline.mjs`. Plan 002 provides reservation manifests.

Required transaction behavior:

1. Parse every pending addition first.
2. Reject the whole batch before mutation if any file is malformed or any invariant fails.
3. Reconcile additions against one mutable working tracker, including earlier additions in the same batch.
4. Never renumber tracker ID independently of report identity.
5. Validate final tracker before commit.
6. Commit tracker with atomic sibling-file rename.
7. Archive only files represented in committed output.
8. A retry after interruption is idempotent.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Syntax | `node --check merge-tracker.mjs` | exit 0 |
| Focused tests | `node --test test/merge-tracker.test.mjs` | all pass |
| Dry run | `node merge-tracker.mjs --dry-run --verify` | exit 0, no writes |
| Full verification | `npm test && npm run verify` | exit 0 |

## Scope

**In scope**:
- `merge-tracker.mjs`
- `lib/tracker.mjs`
- `lib/report-reservations.mjs` only for committed reservation-state API
- `test/merge-tracker.test.mjs` (create)
- `modes/pipeline.md`
- `plans/README.md`

**Out of scope**:
- Fuzzy-role algorithm redesign beyond making current policy batch-coherent.
- Destructive tracker-wide dedup; Plan 004 owns it.
- Historical ID/report repairs.
- Changing accepted one-row-per-file input contract.
- Moving tracker out of Markdown.

## Git workflow

- Branch: `advisor/003-atomic-tracker-merge`
- Commit message example: `Make tracker merge atomic and fail closed`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Separate planning from committing

Refactor `merge-tracker.mjs` into import-safe named functions:

- `readAdditionFile(content, filename, statusRegistry)` returns a strict parsed row or errors. Reject multi-row content, unknown status, mismatched report identity, invalid ID, and malformed field count.
- `planTrackerMerge(existingDocument, additions, options)` returns `{ finalDocument, outcomes, errors }` without filesystem writes.
- `commitTrackerMerge(plan, paths)` performs commit only when `errors` is empty.

Keep CLI argument parsing and logging in `main()`. Use a direct-invocation guard.

**Verify**: `node --check merge-tracker.mjs` -> exit 0.

### Step 2: Reconcile against an evolving working set

In `planTrackerMerge`:

1. Parse and validate existing tracker through `lib/tracker.mjs`.
2. Build indexes by tracker ID, report ID, and normalized company/role.
3. Process additions in deterministic numeric filename order.
4. After each accepted addition or update, immediately update every index and row object.
5. Exact report-ID or tracker-ID collision with different job identity is an error, not a renumbering opportunity.
6. For an actual re-evaluation, preserve one coherent evaluation tuple: date, score, PDF, report, and evaluation notes must come from the same selected record. Preserve current lifecycle status unless the input explicitly represents a permitted user state transition.
7. Produce one outcome per file: `added`, `updated`, `duplicate-no-change`, or `error`.

Treat `duplicate-no-change` as successfully handled only when existing committed tracker contains the same report/job identity. Do not conflate malformed with skipped.

**Verify**: focused pure-function tests for two same-batch duplicate additions, two sequential re-evaluations, ID collision, and report collision -> all pass.

### Step 3: Validate before any mutation

Run `validateTrackerDocument(finalDocument, registry)` and report all errors. Also confirm every accepted report path exists or is created in the same reserved pipeline run. `--verify` must run this preflight and the Plan 001 verifier before commit, never after commit.

If any addition or final invariant fails, exit 1 and leave tracker, additions, reservation manifests, and archive unchanged.

**Verify**: malformed fixture test confirms byte-identical tracker and unchanged pending files.

### Step 4: Commit recoverably

Write the final tracker to `data/.applications.md.<runId>.tmp` with exclusive create. Close it, then rename over `data/applications.md` only after validation. Archive each successful input using destination names that cannot overwrite prior files. If archive staging fails before tracker rename, abort unchanged.

Use a small transaction journal under `batch/tracker-additions/.transactions/<runId>.json` to record planned source/destination paths and final tracker digest. On retry, detect whether commit already occurred by digest and finish archival idempotently. Never guess based on file absence alone.

After successful merge, mark corresponding Plan 002 reservations `committed` only when report and tracker identities match.

**Verify**: failure-injection tests at preflight, temp write, archive staging, tracker rename, and post-rename recovery -> final state is either wholly old or recoverably committed.

### Step 5: Update pipeline contract

Update `modes/pipeline.md` so tracker merge failure leaves the pipeline job unprocessed and reservation active. Only after successful merge may coordinator mark the queue item processed and reservation committed.

**Verify**: repository search shows pipeline mode orders operations as report write -> tracker preflight/commit -> pipeline processed transition.

## Test plan

Create `test/merge-tracker.test.mjs` using temporary directories. Cover:

- Valid single add.
- Two distinct additions.
- Same-batch exact duplicate.
- Same-batch fuzzy duplicate under existing policy.
- Two increasing-score updates.
- Unknown status.
- Malformed and multi-row file.
- Tracker ID collision.
- Report ID mismatch/collision.
- Missing report.
- Archive destination collision.
- Each failure-injection point.
- Retry after tracker rename but before archival completion.
- Dry-run and verify modes write nothing.

## Done criteria

- [ ] `npm test && npm run verify` exits 0.
- [ ] Malformed input remains pending and causes exit 1.
- [ ] Same-batch additions see earlier accepted additions.
- [ ] No independent tracker-ID renumbering remains.
- [ ] `--verify` performs no post-mutation validation.
- [ ] Failure-injection tests prove old-or-recoverable state.
- [ ] Only committed additions enter `merged/`.

## STOP conditions

- Plans 001/002 are not complete or their contracts differ materially.
- Current tracker violates Plan 001 invariants.
- A supported workflow relies on silently coercing unknown status to `Evaluated`.
- Atomic rename semantics are unavailable on the target filesystem. Report platform and proposed alternative; do not downgrade silently.
- Fix requires changing historical tracker identities.

## Maintenance notes

Reviewers should focus on idempotency and failure ordering, not only happy-path output. Any future tracker field must be added to shared parser, serializer, verifier, merge planner, and tests together. Keep one-row-per-addition until a separately specified bulk format exists.