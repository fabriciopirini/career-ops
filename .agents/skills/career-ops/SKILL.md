---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
arguments: mode
user-invocable: true
argument-hint: "[scan | eval | apply | tracker | pipeline | application-prep | ap]"
license: MIT
---

# career-ops -- Router

## Mode Routing

Determine the mode from `$mode`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `eval` or `oferta` | `oferta` |
| `scan` | `scan` (full scan: `scan.mjs` + Level 3 WebSearch + liveness verify) |
| `scan quick` | `scan` (quick scan: `scan.mjs` only, skip Level 3) |
| `apply` | `apply` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `application-prep` | `application-prep` (after evaluation, prepare application package) |
| `ap` | `application-prep` (short alias) |

**Auto-pipeline detection:** If `$mode` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

If `$mode` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
career-ops -- Command Center

Available commands:
  /career-ops {JD}        → AUTO-PIPELINE: evaluate + form answers + package (paste text or URL)
  /career-ops scan         → Full scan: providers + WebSearch Level 3 + liveness verify
  /career-ops scan quick   → Quick provider/API scan only
  /career-ops pipeline     → Process pending URLs from inbox (data/pipeline.md)
  /career-ops eval         → Evaluate a single offer (A-G report)
  /career-ops apply        → Application form assistant (Playwright extracts form + generates answers)
  /career-ops tracker      → Application status overview
  /career-ops ap           → Generate application package (resume PDF, cover letter, form answers)

Inbox: add URLs to data/pipeline.md → /career-ops pipeline
Or paste a JD directly to run the full pipeline.
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + their mode file:
Read `modes/_shared.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `oferta`, `apply`, `pipeline`, `scan`

### Standalone modes (only their mode file):
Read `modes/{mode}.md`

Applies to: `tracker`

### Delegated to skill invocation:
`application-prep` / `ap` — Invoke `/skill:application-prep` instead of loading a mode file. This skill handles the full application package workflow: customize resume, generate cover letter, humanize text, normalize typography, produce PDFs, extract form fields, and draft answers.

### Modes delegated to subagent:
For `scan` and `apply` (with Playwright): launch as Agent with the content of `_shared.md` + `modes/{mode}.md` injected into the subagent prompt.

**Scan default:** `/career-ops scan` MUST run the full flow. First execute `node scan.mjs`, then run Level 3 WebSearch for every enabled `search_queries` entry in `portals.yml`, dedupe against `scan-history.tsv`, `applications.md`, and `pipeline.md`, verify new Level 3 hits with Playwright sequentially, then write `pipeline.md` and `scan-history.tsv`. Only skip Level 3 when the user explicitly invokes `scan quick` or says quick/provider-only scan.

```
subagent(
  agent="delegate",
  task="[content of modes/_shared.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="career-ops {mode}"
)
```

Execute the instructions from the loaded mode file.
