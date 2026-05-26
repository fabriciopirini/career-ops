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
| `render-resume-html.mjs` | Resume HTML from portfolio TypeScript data (supports `--override`) |
| `generate-pdf-from-html.mjs` | HTML -> PDF via Playwright |
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
2. **Zero em dashes:** Replace ALL \u2014 and \u2013 with `-`. No exceptions.
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
- **Generated:** Standalone HTML via `render-resume-html.mjs` (tsx import, no Next.js caching)
- **Fonts:** Source Sans 3 (body) + Roboto (headings), accent color `#0395de`
- **No portfolio files modified during application prep** -- override JSON approach
