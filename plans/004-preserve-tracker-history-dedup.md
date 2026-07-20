# Plan 004: Preserve tracker history during duplicate consolidation

> **Executor instructions**: Execute steps in order, run every verification command, and stop on any STOP condition. Do not improvise. Update this plan's status in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 53953d4..HEAD -- dedup-tracker.mjs lib/tracker.mjs templates/states.yml test/dedup-tracker.test.mjs`
> Plans 001 and 003 intentionally affect shared tracker code. Confirm their current contracts before modifying dedup.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-verification-baseline.md`, `plans/003-make-tracker-merge-atomic.md`
- **Category**: correctness
- **Planned at**: commit `53953d4`, 2026-07-20

## Why this matters

Current dedup keeps the highest-scored row, copies a numerically ranked status, and deletes every other row. It does not preserve removed notes, report/PDF provenance, or lifecycle chronology. The rank also omits `Applied-ready` and can prefer `Evaluated` over `Rejected`, making a terminal application look active.

## Benchmark gate

Before editing, run `npm run benchmark -- --iterations=30` and preserve the JSON/Markdown baseline artifact. After editing, run `npm run benchmark:compare -- <baseline.json> <candidate.json>` with the same fixture version and iteration policy. Dedup fixtures must preserve notes, report/PDF provenance, coherent lifecycle state, and zero invariant failures; evaluation-candidate and liveness-call work proxies must not increase. Report median and p95 latency; no more than 10% regression on unaffected local workloads. Token claims require provider telemetry; otherwise report labeled work-proxy deltas only.

## Current state

- `templates/states.yml:9-62` defines lifecycle meanings but no numeric progression.
- `dedup-tracker.mjs:26-50` invents a rank, omits `Applied-ready`, and ranks `Evaluated` above `Rejected`.
- `dedup-tracker.mjs:157-190` chooses keeper by highest score, then promotes highest-ranked status without date/event semantics.
- `dedup-tracker.mjs:192-210` updates only status and deletes all duplicate rows; report, PDF, date, and notes from removed rows are discarded.
- `dedup-tracker.mjs:132-140` indexes line locations by numeric ID before proving IDs unique.
- Plan 001 provides strict parsing/invariants. Plan 003 provides recoverable atomic commit mechanics; reuse them rather than building another writer.

Required consolidation policy:

1. Duplicate detection and duplicate consolidation are separate phases.
2. Default mode reports proposed clusters without deleting anything.
3. Automatic consolidation is allowed only for exact report identity or exact canonical posting identity.
4. Fuzzy company/role matches require explicit `--accept-cluster <id>` or an input decisions file.
5. Selected evaluation tuple remains coherent: date, score, PDF, report, and evaluation-specific notes come from one row.
6. Current status comes from explicit dated/current-state policy, never numeric rank.
7. Notes from every source row survive with stable source attribution.
8. No deletion occurs until final document validates.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Syntax | `node --check dedup-tracker.mjs` | exit 0 |
| Focused tests | `node --test test/dedup-tracker.test.mjs` | all pass |
| Preview | `node dedup-tracker.mjs --dry-run` | proposed clusters only, no writes |
| Full verification | `npm test && npm run verify` | exit 0 |

## Scope

**In scope**:
- `dedup-tracker.mjs`
- `lib/tracker.mjs` only for shared consolidation helpers/invariants
- `test/dedup-tracker.test.mjs` (create)
- `templates/states.yml` only if adding nonbreaking transition metadata is explicitly approved
- `plans/README.md`

**Out of scope**:
- Changing canonical status labels.
- Automatic fuzzy deletion without human disposition.
- Repairing historical duplicates during implementation.
- Changing scan-time duplicate policy.
- Replacing Markdown storage.

## Git workflow

- Branch: `advisor/004-safe-tracker-dedup`
- Commit message example: `Preserve tracker history during deduplication`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Extract duplicate discovery as pure logic

Refactor into import-safe functions:

- `findDuplicateClusters(rows)`: return stable cluster IDs, match evidence, confidence (`exact` or `fuzzy`), and source line/entry IDs. Store line index directly on parsed rows; do not use a map keyed by an unvalidated ID.
- Preserve current normalization/fuzzy matching initially as characterization behavior.
- `renderDuplicatePlan(clusters)`: print what would be retained/merged/removed without mutation.

Default CLI behavior and `--dry-run` must only report. Add explicit `--apply` for approved exact clusters and `--decisions <json>` for fuzzy clusters.

**Verify**: `node dedup-tracker.mjs --dry-run` -> no changed files.

### Step 2: Define coherent merge provenance

Implement `consolidateCluster(cluster, decision)`:

- `decision.evaluationEntryId` selects the complete evaluation tuple: date, score, PDF, report.
- `decision.currentStatusEntryId` selects status based on human-confirmed current record. For exact duplicates with identical status, selection may be automatic.
- Merge notes from all rows as stable, de-duplicated segments prefixed with source entry ID only when needed to preserve meaning.
- Retain a machine-readable consolidation note containing removed entry IDs and report references.
- Reject a decision that selects missing rows, mismatches report identity, or would downgrade an `Applied-ready`, `Applied`, `Interview`, `Offer`, `Rejected`, or `Discarded` state without explicit override.

Do not add numeric status ranking. Canonical states describe categories, not total ordering.

**Verify**: unit tests demonstrate that evaluation fields never mix across source rows and all notes survive.

### Step 3: Validate and commit through shared transaction path

Before applying:

1. Validate original tracker.
2. Validate every decision against its cluster.
3. Produce final document in memory.
4. Validate final tracker.
5. Commit using Plan 003 atomic/recovery helper.

If any cluster lacks a required fuzzy decision, leave it untouched and report it. A single invalid explicit decision must abort the whole requested apply operation before mutation.

**Verify**: invalid-decision fixture leaves tracker byte-identical and exits 1.

### Step 4: Add exhaustive lifecycle regression tests

Create `test/dedup-tracker.test.mjs`. Include all canonical statuses from `templates/states.yml`; specifically cover:

- `Evaluated` plus `Rejected` retains explicitly selected current terminal state.
- `Applied-ready` is recognized and never treated as rank zero.
- Higher score does not silently replace current status.
- Selected report/PDF/date/score remain from one source row.
- Notes and report references from removed rows survive.
- Duplicate numeric IDs cause preflight abort.
- Exact duplicate may auto-consolidate only when identity and status agree.
- Fuzzy duplicate requires decision.
- Non-transitive role similarity does not absorb unrelated rows.
- Dry-run does not write.

**Verify**: `node --test test/dedup-tracker.test.mjs` -> all pass.

## Test plan

At least 14 cases, including every status label and four conflicting lifecycle combinations. Tests use temporary tracker fixtures. No test may mutate live `data/applications.md`.

## Done criteria

- [ ] `npm test && npm run verify` exits 0.
- [ ] Default dedup invocation is non-destructive preview.
- [ ] No `STATUS_RANK` remains.
- [ ] Fuzzy clusters require explicit decisions.
- [ ] Consolidated rows preserve coherent evaluation tuple and all source notes.
- [ ] Invalid tracker or decision causes zero mutation.
- [ ] No live tracker rows were consolidated during implementation.

## STOP conditions

- Plans 001/003 are incomplete or shared APIs differ materially.
- Product owner requires fully automatic fuzzy deletion. Report the data-loss tradeoff; do not implement silently.
- Current data lacks enough chronology to determine present lifecycle state. Require explicit decisions rather than guessing.
- Preserving source notes cannot fit the current Markdown row without structural delimiters. Report and propose encoded/structured storage separately.

## Maintenance notes

Dedup is a data migration, not routine cleanup. Keep preview as default and require reviewed decisions for fuzzy clusters. Reviewers should inspect provenance and terminal-state handling more closely than match recall.