# Proposal: Parallel Application Prep via Subagents

**Status:** Draft
**Date:** 2026-06-10
**Author:** Fabricio Pirini (via Pi)

---

## Summary

Enable `/career-ops ap` to generate application packages for 2+ roles concurrently using fresh-context delegate subagents. Each role is fully independent — separate evaluation reports, output directories, and overrides. No shared mutable state blocks parallelism.

---

## Current State

`/career-ops ap` (delegates to `/skill:application-prep`) is strictly sequential:
1. Read eval report → 2. Override JSON → 3. Resume PDF → 4. Cover letter → 5. Humanize → 6. Normalize → 7. Cover PDF → 8. Form answers → 9. Present → 10. Tracker update

For N roles, this means N sequential runs. Each takes ~3-5 min. 3 roles = 9-15 min wall-clock.

---

## Why Parallelism Works Here

| Property | Status |
|----------|--------|
| Per-role data isolation | ✅ Separate eval reports, separate `output/{slug}/{date}-{role}/` dirs |
| Portfolio data | ✅ Read-only (never mutated by application-prep) |
| Script inputs/outputs | ✅ Fully self-contained per role — no shared temp files needed (after fix) |
| Subagent context | ✅ Fresh-context delegates inherit project AGENTS.md + skills, then re-read role-specific files |
| Playwright restriction | ✅ Doesn't apply — Typst pipeline, no browser automation |

---

## Blockers (Must Fix)

### 1. `generate-resume.mjs` temp file race

**Root cause:** `scripts/generate-resume.mjs:44` writes to `/home/pirini/dev/portfolio/.tmp-extract.cjs` — a hardcoded path. Two concurrent runs collide.

**Fix:** Use `fs.mkdtempSync()` + `path.join(tmpdir, '.tmp-extract-XXXXXX.cjs')` so each run gets its own temp file. Same fix needed in `generate-resume-pdf.mjs:47` and `application-form.mjs:42`.

**Effort:** ~10 lines changed across 3 files.

### 2. `merge-tracker.mjs` single-entry bug

**Root cause:** `parseTsvContent()` reads the full file content but only parses the first line. Multi-entry TSV files silently drop all but the first entry.

**Fix:** Split content by `\n`, filter non-empty lines, parse each, return array of additions.

**Effort:** ~20 lines changed in `merge-tracker.mjs`.

### 3. Fresh-context subagent needs explicit file list

**Root cause:** Fresh-context subagents don't see parent conversation. They need to know which evaluation report to process.

**Fix:** Pass evaluation report path + output directory in the subagent task string. The subagent reads the report, then follows the standard application-prep workflow.

**Effort:** No code changes — just task construction.

---

## Design

### New CLI entry point (or mode detection)

```
/career-ops ap --reports=reports/005-acme-2026-06-10.md,reports/006-beta-2026-06-10.md
```

Or auto-detect: if user provides 2+ evaluation report paths, switch to parallel mode.

### Parallel execution flow

```
Parent:
  1. Parse report paths from user input
  2. For each report:
     a. Extract company slug, role slug, date from report header/filename
     b. Build task string with full paths
  3. Launch N parallel delegate subagents (fresh context, async)
  4. Wait for all to complete
  5. Run merge-tracker.mjs once (all TSVs already written by subagents)
  6. Present summary of generated files

Subagent (per role):
  1. Read assigned evaluation report
  2. Read ~/dev/portfolio/lib/career-data.ts, config/profile.yml
  3. Follow /skill:application-prep steps 2-9
     → override.json, resume PDF, cover letter (if needed), form answers
  4. Write tracker TSV to batch/tracker-additions/{###}-{company}.tsv
  5. Report: [company] [role] → files generated, any issues
```

### Subagent configuration

```javascript
subagent({
  agent: "delegate",
  context: "fresh",
  skill: "application-prep",
  task: `Generate application package for:
    Report: reports/005-acme-2026-06-10.md
    Output dir: output/acme/2026-06-10-senior-frontend/
    Variant: default
    Skip cover letter unless form requires it.
    Write tracker TSV when done.`,
  async: true,
})
```

### Why delegate (not worker)

| Agent | Context | Fits? |
|-------|---------|-------|
| `delegate` | Fresh | ✅ Lightweight, inherits project context, can edit files |
| `worker` | Forked | ❌ Forked context fails without API keys (known issue) |
| `context-builder` | Fresh | ❌ Read-only, can't generate PDFs |

Delegate with fresh context is the right fit: it inherits AGENTS.md (career-ops rules) + skill definitions, then re-reads role-specific files independently.

---

## Changes by File

### `scripts/generate-resume.mjs` — Fix temp file race
- Replace hardcoded `.tmp-extract.cjs` with `mkdtempSync` unique filename
- Clean up in `finally` block

### `generate-resume-pdf.mjs` — Fix temp file race
- Same fix as above

### `application-form.mjs` — Fix temp file race  
- Same fix as above

### `merge-tracker.mjs` — Fix single-entry bug
- `parseTsvContent()` → split by newlines, return array
- Caller loops over returned entries

### `.agents/skills/application-prep/SKILL.md` — Document parallel usage
- Add "Parallel Execution" section
- Document subagent task template
- Document tracker TSV requirement (one entry per file)

### `.agents/skills/career-ops/SKILL.md` — Add parallel routing
- `ap --reports=...` or auto-detect multi-report input
- Launch parallel delegates instead of inline execution

### `AGENTS.md` — Document parallel workflow
- Add session learning about parallel application prep
- Document temp file race fix

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Typst compilation resource contention | Low | Typst processes are CPU-only, short-lived (~1s). N=3 is fine. |
| `tsx` import race on portfolio files | Low | Portfolio files are read-only. tsx imports are per-process, isolated. |
| Subagent fails mid-workflow | Medium | Each subagent writes to isolated output dir. Failed ones leave partial state — parent detects missing files and can re-launch. |
| Humanizer invocation in subagent | Medium | Humanizer is a skill — delegate subagents can invoke skills. Verify delegate has `humanizer` in available skills. |
| merge-tracker TSV collision if subagents finish simultaneously | Low | Each subagent writes unique filename (`{###}-{company}.tsv`). Merge processes all files in one pass. |

---

## Acceptance Criteria

1. `merge-tracker.mjs` processes multi-entry TSV files correctly
2. `generate-resume.mjs` uses unique temp files (no race on parallel runs)
3. Two parallel `delegate` subagents produce complete application packages in separate output dirs
4. Tracker receives both entries after merge
5. No portfolio files modified
6. No em dashes in any output
7. Wall-clock time for 2 roles < time for 1 role × 1.3 (near-linear speedup)

---

## Out of Scope

- Parallel evaluation (`auto-pipeline` for multiple JDs) — separate proposal
- Parallel `scan` — already uses subagents per the router skill
- Cover letter auto-decision in subagents — subagents follow the same "check form first" rule
- Shared override.json between roles — each role gets its own
