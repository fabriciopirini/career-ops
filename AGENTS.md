# Career-Ops -- AI Job Search Pipeline

Forked from `santifer/career-ops`, customized for **Fabricio Pirini**. Targets Senior Frontend, Design System, Growth, Full Stack, and Developer Experience roles. Fully remote, UTC-3.

Portfolio at `~/dev/portfolio/` is the source of truth for career data (`lib/career-data.ts`). Career-ops reads it, generates application materials with per-job overrides, and never touches portfolio files.

## Data Contract (CRITICAL)

**User Layer (NEVER auto-updated):**
- `cv.md`, `config/profile.yml`, `modes/_profile.md`, `portals.yml`
- `data/*`, `reports/*`, `output/*`, `interview-prep/*`

**System Layer (auto-updatable):**
- `modes/_shared.md`, `modes/oferta.md`, all other modes
- `AGENTS.md`, `*.mjs` scripts, `templates/*`

**THE RULE:** User customizations go in `modes/_profile.md` or `config/profile.yml`. NEVER in `modes/_shared.md`.

## Session Start

Check silently:
1. `cv.md` exists?
2. `config/profile.yml` exists?
3. `modes/_profile.md` exists?
4. `portals.yml` exists?

If any missing -> onboarding mode (guide user step by step).

## Workflows

### A) No JD provided -> Scan

```
/career-ops scan
```

1. `node scan.mjs` (zero-token: local parsers + Greenhouse/Ashby/Lever APIs)
2. For companies without parser: Playwright navigation to `careers_url`
3. WebSearch queries for broad discovery
4. Dedup against scan-history, applications, pipeline
5. Filter by title + location
6. Verify liveness of WebSearch results via Playwright
7. Add matching offers to `data/pipeline.md`

### B) JD provided -> Evaluate

Paste JD URL or text.

1. Auto-detect archetype (Frontend/Design Systems/Growth/Full Stack/DE)
2. Generate A-G report in `reports/{###}-{company}-{YYYY-MM-DD}.md`:
   - A: Role summary
   - B: Match with CV (proof point mapping)
   - C: Level and strategy
   - D: Comp and demand research
   - E: Customization plan
   - F: Interview plan (STAR+R stories)
   - G: Posting legitimacy
   - H: Pre-draft application answers
3. Register in tracker: write TSV to `batch/tracker-additions/`

### C) User wants to apply -> Application package

```
/skill:application-prep
```

| Step | What it does |
|------|-------------|
| 1 | Read evaluation report + portfolio data |
| 2 | Create `output/{###}-{company}-override.json` (subtitle, summary, per-job bullet overrides) |
| 3 | Render resume HTML via `render-resume-html.mjs --override=...` |
| 4 | Generate cover letter HTML matching portfolio design |
| 5 | Humanize ALL text via `/skill:humanizer` (MANDATORY) |
| 6 | Strip ALL em dashes + normalize typography (MANDATORY) |
| 7 | Generate resume + cover letter PDFs via Playwright |
| 8 | Extract form fields from JD URL via `application-form.mjs` + generate per-question answers |
| 9 | Present PDFs + form answers to user for review |
| 10 | Update tracker: status = Applied-ready |

**NEVER submit.** User reviews, copies answers into form, clicks Submit.

## Key Files

| File | Purpose |
|------|---------|
| `scan.mjs` | Zero-token portal scanner (Greenhouse/Ashby/Lever APIs + local parsers) |
| `providers/` | Scanner provider implementations |
| `portals.yml` | Query and company config |
| `generate-resume-pdf.mjs` | **PREFERRED** - Resume PDF via Typst typesetting. Reads career-data.ts via tsx, applies overrides, writes JSON, shells out to typst compile. Roboto + Source Sans 3 fonts |
| `generate-pdf-from-html.mjs` | Dual mode: Typst cover letter (preferred, --body/--body-file) or legacy Playwright HTML→PDF |
| `templates/resume.typ` | Typst resume template (header, summary, skills, experience, education, footer) |
| `templates/cover-letter.typ` | Typst cover letter template (matching resume header + body + closing) |
| `templates/icons/` | SVG icons for contact row (mail, globe, linkedin, github) |
| `application-form.mjs` | Playwright form field extraction + draft answer generation |
| `normalize-typography.mjs` | ATS-safe typography normalization |
| `check-liveness.mjs` / `liveness-*.mjs` | Job posting liveness verification |
| `merge-tracker.mjs` | Merge TSV additions into tracker |
| `normalize-statuses.mjs` | Normalize statuses to canonical form |
| `dedup-tracker.mjs` | Deduplicate tracker entries |
| `data/applications.md` | Application tracker |
| `data/pipeline.md` | Inbox of pending URLs |
| `data/scan-history.tsv` | Scanner dedup history |
| `reports/` | Evaluation reports (A-G blocks) |
| `interview-prep/` | STAR+R story bank + company intel |
| `modes/_shared.md` | System rules, scoring, writing standards |
| `modes/_profile.md` | User archetypes, framing, proof points |
| `modes/oferta.md` | Evaluation mode instructions |
| `templates/states.yml` | Canonical application states |
| `templates/cv-template.html` | HTML template for CVs |

## Rules (MANDATORY)

1. **Humanizer:** Every candidate-facing text block -> run `/skill:humanizer`
2. **Zero em/en dashes:** Rewrite sentences to avoid dash constructions entirely. Don't mechanically replace character -- restructure the sentence. No exceptions.
3. **No score gate for form answers:** Always generate H block pre-drafts + application-form answers.
4. **NEVER submit:** Generate everything, stop before click.
5. **Override approach:** Create override JSON for resume customizations, never edit portfolio files directly.
6. **Tracker via TSV:** Write to `batch/tracker-additions/`, run `merge-tracker.mjs`.
7. **Low-score flag:** Score below 4.0? Recommend against applying.
8. **No invented metrics:** Read proof points from career-data.ts / cv.md / profile.yml at evaluation time.

## Pipeline Integrity

1. **NEVER edit applications.md to ADD new entries** -- use TSV + merge-tracker
2. **YES edit applications.md to UPDATE** status/notes of existing entries
3. All reports MUST include `**URL:**` and `**Legitimacy:** {tier}` in header
4. All statuses MUST be canonical (see `templates/states.yml`)
5. Run `node normalize-statuses.mjs` + `node dedup-tracker.mjs` + `node merge-tracker.mjs` after batch work

## Canonical States

| State | When to use |
|-------|-------------|
| `Evaluated` | Report completed, pending decision |
| `Applied` | Application sent |
| `Responded` | Company responded |
| `Interview` | In interview process |
| `Offer` | Offer received |
| `Rejected` | Rejected by company |
| `Discarded` | Discarded by candidate or offer closed |
| `SKIP` | Doesn't fit, don't apply |

## Resume Source of Truth

- **Canonical data:** `~/dev/portfolio/lib/career-data.ts` (3 variants: default/growth/product)
- **Generated:** PDF via `generate-resume-pdf.mjs` (Typst typesetting, reads career-data.ts via tsx, applies override JSON, writes JSON, calls `typst compile`). Named `Fabricio-Pirini-{COMPANY}-Resume.pdf`
- **Cover letter:** PDF via `generate-pdf-from-html.mjs --body-file` (Typst, same fonts/colors as resume). Named `Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf`. No accompanying HTML needed.
- **Workflow:** Reads career data → writes JSON → `typst compile templates/resume.typ` → PDF. No dev server, no Playwright, no npm rendering deps.
- **Fonts:** Source Sans 3 (body) + Roboto (headings), accent color `#0395de`, TTF files in `lib/fonts/` (loaded via `--font-path`)
- **Typst binary:** `~/.typst/bin/typst` (install via `install.sh`)
- **No portfolio files touched** -- override JSON approach, career data read-only via tsx import

## Session Learnings (May 2026)

### Cover letter naming convention
Cover letters follow resume naming: `Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf`. Not `{###}-{company}-cover-letter.pdf`.

### application-form.mjs ESM fix
`.mjs` extension forces ESM mode. `require()` is not available. All imports must use ESM `import` syntax. The `parseReport()` function previously used `require('fs').readFileSync()` — fixed to use `import { readFileSync } from 'fs'`.

### PDF generation via Typst (May 2026)
Replaced `@json-render/react-pdf` with Typst typesetting. `generate-resume-pdf.mjs` writes career data as JSON, shells out to `typst compile templates/resume.typ`. Templates at `templates/resume.typ` and `templates/cover-letter.typ`. SVG icons in `templates/icons/`. Fonts loaded from `lib/fonts/` via `--font-path`. Typst binary at `~/.typst/bin/typst`. Old react-pdf files deleted: `lib/resume-catalog.mjs`, `lib/resume-spec.mjs`, `lib/cover-letter-spec.mjs`. Dependencies removed: `@json-render/core`, `@json-render/react-pdf`.

### Ashby tab-based forms
Ashby uses tabs (Overview / Application) instead of a separate Apply URL/page. The `application-form.mjs` script only searches for Apply buttons/links, not tabs. When processing Ashby jobs, manually click the Application tab via Playwright before calling form extraction.

### TSV tracker additions
merge-tracker.mjs does not skip header rows in TSV files. Use pipe-delimited markdown table rows (starting with `|`) instead of tab-separated values with headers. Example:
```
| 2 | 2026-05-27 | Clipboard | Role | 2.5/5 | Evaluated | ❌ | [002](reports/002-...) | Notes |
```
