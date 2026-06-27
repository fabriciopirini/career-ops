# Mode: pipeline — URL Inbox (Second Brain)

Process job URLs stored in `data/pipeline.md`. The user adds URLs at any time and then executes `/career-ops pipeline` to process them all.

## Workflow

1. **Read** `data/pipeline.md` → search for `- [ ]` items in the "Pending" section
2. **For each pending URL**:
   a. Calculate the next sequential `REPORT_NUM` (read `reports/`, take the highest number + 1)
   b. **Extract JD** using Playwright (browser_navigate + browser_snapshot) → WebFetch → WebSearch
   c. If the URL is not accessible → mark as `- [!]` with a note and continue
   d. **Execute full auto-pipeline**: Evaluation A-F → Report .md → PDF (if score >= 3.0) → Tracker
   e. **Move from "Pending" to "Processed"**: `- [x] #NNN | URL | Company | Role | Score/5 | PDF ✅/❌`
3. **If there are 3+ pending URLs**, launch agents in parallel (Agent tool with `run_in_background`) to maximize speed.
4. **At the end**, show summary table. **The `JD` column is MANDATORY** — the user reviews by opening the posting, so every processed job MUST link to its source URL:

```
| # | Company | Role | Score | PDF | JD | Recommended action |
|---|---------|------|-------|-----|-----|--------------------|
| 100 | Kilo Code | Senior Software Engineer | 3.6/5 | ❌ | [posting](https://jobs.ashbyhq.com/kilocode/79824204-...) | Apply with reason. DX/product fit... |
```

**Rules for the summary table:**
- **Always include a `JD` column** with a clickable markdown link to the job posting URL. No exceptions, even for low scores or SKIPs — the user needs the link to judge the call.
- Link text: `posting` (keeps the table narrow). Do not paste raw long URLs as plain text.
- If the source was a secondary portal (WebSearch result) rather than the ATS, link the ATS posting when known; otherwise link the verified source.
- For private/local JDs (`local:jds/...`), link the report file instead: `[report](reports/NNN-....md)`.
- Run the table even when only one job was processed.

## Format of pipeline.md

```markdown
## Pending
- [ ] https://jobs.example.com/posting/123
- [ ] https://boards.greenhouse.io/company/jobs/456 | Company Inc | Senior PM
- [!] https://private.url/job — Error: login required

## Processed
- [x] #143 | https://jobs.example.com/posting/789 | Acme Corp | AI PM | 4.2/5 | PDF ✅
- [x] #144 | https://boards.greenhouse.io/xyz/jobs/012 | BigCo | SA | 2.1/5 | PDF ❌
```

## Intelligent JD detection from URL

1. **Playwright (preferred):** `browser_navigate` + `browser_snapshot`. Works with all SPAs.
2. **WebFetch (fallback):** For static pages or when Playwright is unavailable.
3. **WebSearch (last resort):** Search in secondary portals that index the JD.

**Special cases:**
- **LinkedIn**: May require login → mark `[!]` and ask the user to paste the text
- **PDF**: If the URL points to a PDF, read it directly with the Read tool
- **`local:` prefix**: Read the local file. Example: `local:jds/linkedin-pm-ai.md` → read `jds/linkedin-pm-ai.md`

## Automatic numbering

1. List all files in `reports/`
2. Extract the number from the prefix (e.g., `142-medispend...` → 142)
3. New number = maximum found + 1

## Source synchronization

Before processing any URL, verify sync:
```bash
node cv-sync-check.mjs
```
If the script reports missing required files, stop and fix onboarding first. If it reports warnings only, mention them and continue.

## Tracker additions

Write tracker additions as `batch/tracker-additions/{###}-{company}.tsv`.

Accepted content is one pipe-delimited markdown row:
```markdown
| 137 | 2026-06-27 | Company | Role | 4.1/5 | Evaluated | ❌ | [137](reports/137-company-2026-06-27.md) | Notes |
```

Then run:
```bash
node merge-tracker.mjs
```

Do not use `.md` for pending additions. `merge-tracker.mjs` accepts old `.md` files only as a compatibility fallback and moves processed files to `batch/tracker-additions/merged/`.
