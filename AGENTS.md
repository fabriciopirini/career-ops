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
| 2 | Create `output/{company-slug}/{YYYY-MM-DD}-{role-slug}/override.json` (archetype, subtitle, summary, per-job bullet overrides, adapted role titles) |
| 3 | Generate resume PDF via `scripts/generate-resume.mjs --override=...` (Typst) |
| 4 | Generate cover letter PDF via `scripts/generate-cover.mjs` (optional, if form has field) |
| 5 | Humanize ALL text via `/skill:humanizer` (MANDATORY) |
| 6 | Strip ALL em dashes + normalize typography (MANDATORY) |
| 7 | Extract form fields from JD URL via `application-form.mjs` + generate per-question answers |
| 8 | Present PDFs + form answers to user for review |
| 9 | Update tracker: status = Applied-ready |

**NEVER submit.** User reviews, copies answers into form, clicks Submit.

## Key Files

| File | Purpose |
|------|---------|
| `scan.mjs` | Zero-token portal scanner (Greenhouse/Ashby/Lever APIs + local parsers) |
| `providers/` | Scanner provider implementations |
| `portals.yml` | Query and company config |
| `scripts/generate-resume.mjs` | Resume PDF via Typst typesetting. Reads career-data.ts via tsx, applies overrides, writes JSON, shells out to typst compile. Supports --watch, --dry-run, --validate flags |
| `scripts/generate-cover.mjs` | Cover letter PDF via Typst. Reads body text (or --body-file), constructs data, compiles cover-letter.typ. Supports --watch, --dry-run, --validate flags |
| `scripts/generate-all.mjs` | Bundle command: generates both resume and cover letter with shared override. Use --company="Acme" to name files |
| `lib/config.mjs` | Shared configuration (TYPST_BIN, FONT_PATH, DATA_FILE, logging utilities) |
| `lib/typst-util.mjs` | Typst utilities (compileTypst, writeDataJson, cleanupDataJson, validateData, showDataPreview) |
| `templates/resume.typ` | Typst resume template with inline color/font/spacing constants for easy tweaking |
| `templates/cover-letter.typ` | Typst cover letter template matching resume styling |
| `templates/vars.typ` | Manual override file for colors/sizes/spacing (optional, not yet integrated) |
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
| `Applied-ready` | Application package generated, user has not submitted yet |
| `Applied` | Application sent |
| `Responded` | Company responded |
| `Interview` | In interview process |
| `Offer` | Offer received |
| `Rejected` | Rejected by company |
| `Discarded` | Discarded by candidate or offer closed |
| `SKIP` | Doesn't fit, don't apply |

## Resume Source of Truth

- **Canonical data:** `~/dev/portfolio/lib/career-data.ts` (3 variants: default/growth/product)
- **Resume PDF:** Via `scripts/generate-resume.mjs` (Typst typesetting, reads career-data.ts via tsx, applies override JSON, writes JSON, calls `typst compile`). Named `Fabricio-Pirini-{COMPANY}-Resume.pdf`
- **Cover letter PDF:** Via `scripts/generate-cover.mjs --body-file` (Typst, same fonts/colors as resume). Named `Fabricio-Pirini-Cover-Letter.pdf` inside `output/{company-slug}/{YYYY-MM-DD}-{role-slug}/`. No accompanying HTML needed.
- **Bundle command:** `scripts/generate-all.mjs --company="Acme"` generates both PDFs in one run with shared override and naming.
- **Workflow:** Reads career data → writes JSON → `typst compile templates/resume.typ` → PDF. No dev server, no Playwright, no npm rendering deps.
- **Fonts:** Source Sans 3 (body) + Roboto (headings), accent color `#0395de`, TTF files in `lib/fonts/` (loaded via `--font-path`)
- **Typst binary:** `~/.typst/bin/typst` (install via `install.sh`)
- **No portfolio files touched** -- override JSON approach, career data read-only via tsx import

## Session Learnings (May 2026)

### Cover letter naming convention
All artifacts go under `output/{company-slug}/{YYYY-MM-DD}-{role-slug}/`. Inside: `Fabricio-Pirini-Resume.pdf`, `Fabricio-Pirini-Cover-Letter.pdf`, `form-answers.md`, `override.json`. --role is mandatory.

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

## Typst Workflow Improvements (June 2026)

### DX improvements
- **Shared utilities:** `lib/config.mjs` and `lib/typst-util.mjs` extract shared configuration and Typst helper functions
- **Scripts reorganized:** `scripts/` directory contains `generate-resume.mjs`, `generate-cover.mjs`, `generate-all.mjs` for cleaner structure
- **New flags:**
  - `--watch`: Auto-recompile on template/data changes (via `typst watch`)
  - `--dry-run`: Show data JSON preview without compilation
  - `--validate`: Validate data structure against schema before compilation
- **Bundle command:** `scripts/generate-all.mjs` generates both resume and cover letter with shared override.
- **Template constants:** Inline color/font/spacing constants in `templates/resume.typ` for easy global styling tweaks
- **Better error messages:** Clear logging with timestamps and icons for easier debugging

### Usage examples

```bash
# Generate resume with variant
node scripts/generate-resume.mjs output/acme/2026-06-08-senior-frontend/Fabricio-Pirini-Resume.pdf --variant=growth --override=output/acme/2026-06-08-senior-frontend/override.json

# Generate cover letter from file
node scripts/generate-cover.mjs output/acme/2026-06-08-senior-frontend/Fabricio-Pirini-Cover-Letter.pdf --body-file=output/cover-letter.txt --company="Acme Corp"

# Generate both with bundle command
node scripts/generate-all.mjs --company="Acme" --role="Senior Frontend" --variant=growth --override=output/acme/2026-06-08-senior-frontend/override.json --body-file=output/cover-letter.txt

# Dry-run to preview data
node scripts/generate-resume.mjs output/acme/2026-06-08-senior-frontend/Fabricio-Pirini-Resume.pdf --dry-run

# Validate data structure
node scripts/generate-cover.mjs output/acme/2026-06-08-senior-frontend/Fabricio-Pirini-Cover-Letter.pdf --body="..." --validate

# Watch mode for live preview
node scripts/generate-resume.mjs output/acme/2026-06-08-senior-frontend/Fabricio-Pirini-Resume.pdf --watch
```

### Template styling
Edit inline constants in `templates/resume.typ` to tweak:
- `accent`, `dark`, `body-color`, `muted`, `gray` - Colors
- `fonts` - Font stack (default: `("Source Sans 3", "Roboto")`)
- `sp-job-between`, `sp-bullet-between`, `sp-role-between`, etc. - Spacing
- `size-body`, `size-header`, `size-name`, etc. - Font sizes
- `section-header`, `job-grid`, `role-grid`, `edu-grid` - Helper functions

### Known limitations
- `templates/common.typ` exists but Typst `#include` doesn't export variables as expected. Templates have inline constants for now.
- `templates/vars.typ` exists for manual overrides but isn't integrated yet (manual editing of inline constants required).

### Backward compatibility
- `generate-resume-pdf.mjs` and `generate-pdf-from-html.mjs` (root-level) remain for backward compatibility but are deprecated.
- New scripts in `scripts/` directory have better DX, validation, and watch mode support.
- Old scripts will be removed in a future update.

## Session Learnings (June 2026)

### Humanizer + dash check automated in build pipeline
`validateNoDashes()` in `lib/typst-util.mjs` recursively scans all candidate-facing text (summary, subtitle, bullets, cover letter paragraphs) for em dashes (\u2014) and en dashes (\u2013). Called automatically by both `generate-resume.mjs` and `generate-cover.mjs` after building data but before Typst compilation. Build fails with exact path and snippet if any dashes found. No PDF gets generated with dashes in it. Still need to run humanizer manually before writing override JSON — the guard only checks for dashes, not AI vocabulary patterns.

### Ashby form snapshot misses Yes/No question labels
`snapshot -i` on Ashby Application tabs shows Yes/No buttons but NOT the associated question text. Always follow with `get text body` to extract the full form including screening question labels. Otherwise questions 7-9 (screening Yes/No fields) get missed.

### Subagent forked context loses API keys
`delegate` and `worker` subagents with `context: fork` fail with "No API key found for anthropic." The forked session doesn't inherit auth. For long-running tasks like scan or pipeline evaluation, either run inline or investigate fresh-context subagent with explicit auth setup.

### generate-resume.mjs temp file race condition
Intermittent `ENOENT: no such file or directory, unlink '/home/pirini/dev/portfolio/.tmp-extract.cjs'` error. Always works on retry. The script creates and cleans up a temp file in the portfolio directory; concurrent runs may race on cleanup. Run resume generation sequentially, not in parallel, to avoid this.

### Role adaptation by archetype in override.json
New override keys: `archetype` (frontend|fullstack|product|growth) and `roles` (per-period role title overrides). LLM adapts past job titles to tell a coherent progression story for target domain. `generate-resume.mjs` already supports `override.roles` via `applyRoleOverrides()` — zero code changes needed. Rules: multi-period companies = progression arc (no repeats), "Software Engineer" (generic/single period) stays, "Lead Software Engineer & Tech Lead" stays for all archetypes. Documented in `application-prep` skill Step 2.

### merge-tracker.mjs single-entry bug
`merge-tracker.mjs` only processes 1 entry per pipe-delimited TSV file. Multi-entry TSV files need to be split into individual files before merging. Worker subagent reported this during June 10 pipeline run.

### Pipeline source check exists now
`node cv-sync-check.mjs` is the canonical pre-pipeline source check. It fails only when required files are missing (`cv.md`, `config/profile.yml`, `modes/_profile.md`, `portals.yml`) and warns for optional sources (`article-digest.md`, portfolio files). Do not skip pipeline work because optional files are absent.

### Tracker additions extension
Pending tracker additions should be one pipe-delimited row in `batch/tracker-additions/{###}-{company}.tsv`. `merge-tracker.mjs` also processes legacy `.md` additions, but `.tsv` is the workflow path. Both `.tsv` and `.md` tracker additions are ignored by git to avoid committing personal pipeline data.

### Automattic application gotchas
Automattic form answers should reference the Creed when relevant, especially learning, no status quo, Open Source, and communication as distributed-company oxygen. The secret endpoint `https://public-api.wordpress.com/wpcom/v2/work-with-us` first returns a header hint; retry with `X-future: automattician` to get the secret.
