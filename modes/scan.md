# Mode: scan — Portal Scanner (Job Discovery)

Scans configured job portals, filters by title relevance, and adds new offers to the pipeline for later evaluation.

> **Note (v1.6+):** The default scanner (`scan.mjs` / `npm run scan`) is **zero-token** and uses structured sources: company-specific local parsers and public APIs (Greenhouse, Ashby, Lever). The Playwright/WebSearch levels described below are the **agent** flow (run by the AI), not what `scan.mjs` does. If a company has no local parser and no Greenhouse/Ashby/Lever API, `scan.mjs` skips it; for those cases the agent must manually complete Level 1 (Playwright) or Level 3 (WebSearch).
>
> **Rule (v1.8+):** If a company's local parser succeeds in Level 0, the agent must **not** repeat that company in Playwright (Level 1) or API (Level 2). In Level 3, general queries still run but results from parser-covered companies are discarded. See [Rule: successful local parser — no repeat expensive scraping](#rule-successful-local-parser).

## Recommended Execution

Run as a subagent to avoid consuming main session context:

```
Agent(
    subagent_type="general-purpose",
    prompt="[content of this file + specific data]",
    run_in_background=True
)
```

## Configuration

Read `portals.yml`:
- `search_queries`: WebSearch queries with `site:` filters per portal (broad discovery)
- `tracked_companies`: Specific companies with `careers_url` for direct navigation
- `tracked_companies[].parser`: Optional local parser for SSR or stable HTML pages
- `title_filter`: Positive/negative/seniority_boost keywords for title filtering

## Discovery Strategy (4 levels)

### Level 0 — Local parser (CHEAPEST)

**For each company in `tracked_companies` with `parser:` set:** run the local parser defined in `portals.yml`. This level works best when the careers page uses SSR or stable HTML and a JavaScript, Python, or other runtime script already extracts jobs without agent help.

Recommended contract:

```yaml
- name: Example Company
  careers_url: https://example.com/careers
  scan_method: local_parser
  parser:
    command: node
    script: scripts/parsers/example-company-jobs.js
    format: jobs-json-v1
  enabled: true
```

The parser is typically company-specific and already knows the URL, selectors, and pagination. `args` is optional: use it to help whoever built the script, e.g. to reuse it across companies, pass `{careers_url}` or `{company}`, enable a debug flag, save a JSON snapshot, or control parser-specific behavior.

The parser must print JSON to stdout:

Array format:

```json
[
  { "title": "Senior AI Engineer", "url": "https://example.com/jobs/123", "location": "Remote" }
]
```

Object with `jobs`:

```json
{
  "jobs": [
    { "title": "Senior AI Engineer", "url": "https://example.com/jobs/123", "location": "Remote" }
  ]
}
```

Object with `results`:

```json
{
  "results": [
    { "title": "Senior AI Engineer", "url": "https://example.com/jobs/123", "location": "Remote" }
  ]
}
```

`company` is optional; if absent, `scan.mjs` uses the name from `tracked_companies`.

The scanner does not need to retain the full JSON after reading stdout. If a parser also generates an audit/debug artifact, save it in `data/parser-output/{company}/` and keep it out of git (JSON files in `.gitignore`; keep `.gitkeep` files in git to preserve structure).

### Rule: successful local parser — no repeat expensive scraping

The purpose of `scan_method: local_parser` is to **reduce tokens**: avoid the LLM re-scraping the same company with Playwright or redundant APIs.

During the agent scan, keep an in-memory set **`local_parser_ok`**: company names (`tracked_companies[].name`) where Level 0 completed successfully:

- `parser.command` + `parser.script` exist and the script ran without fatal error
- stdout was valid JSON (`[]`, `{ jobs: [] }`, or `{ results: [] }`)
- No timeout or process crash

| Level | If company is in `local_parser_ok` |
|-------|-------------------------------------|
| **1 — Playwright** | **Skip** — no `browser_navigate` to its `careers_url` (most token-expensive method) |
| **2 — API** | **Skip** — no WebFetch of its `api:` (already covered by parser; `scan.mjs` also skips API after successful parser) |
| **3 — WebSearch** | Run **general** queries (`site:`, role titles); **discard** each hit whose normalized company matches `local_parser_ok` |

**Exceptions:**

- Parser **failed** -> company **not** in `local_parser_ok`; Levels 1 and 2 apply normally (same fallback as `scan.mjs` when parser fails and ATS API exists).
- Level 3: do not disable cross-portal queries (`site:jobs.ashbyhq.com`, `site:boards.greenhouse.io`, etc.) -- they help discover **new** companies. Only filter results from companies already in `tracked_companies` with successful parser.
- Do not create dedicated `search_queries` for a company with an active local parser (e.g. `site:jobs.ashbyhq.com/cohere "AI Engineer"`); use the parser or, if it fails, Playwright/API.

**Recommended Level 0:** run `node scan.mjs` (or `npm run scan`) at the start of the agent workflow. This covers local parsers + APIs in one zero-token pass and returns which companies used `local-parser` successfully.

### Level 1 — Direct Playwright (PRIMARY)

**For each company in `tracked_companies` not in `local_parser_ok`:** Navigate to their `careers_url` with Playwright (`browser_navigate` + `browser_snapshot`), read ALL visible job listings, and extract title + URL for each. This is the most reliable method because:
- Sees the real-time page (no cached Google results)
- Works with SPAs (Ashby, Lever, Workday)
- Detects new offers instantly
- Does not depend on Google indexing

**Every company MUST have `careers_url` in portals.yml.** If missing, find it once, save it, and use in future scans.

### Level 2 — ATS APIs / Feeds (COMPLEMENTARY)

For companies with public API or structured feed **not in `local_parser_ok`**, use the JSON/XML response as a fast complement to Level 1. Faster than Playwright and reduces visual scraping errors.

**Current support (variables in `{}`):**
- **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- **Ashby**: `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR**: list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Lever**: `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor**: `https://{company}.teamtailor.com/jobs.rss`
- **Workday**: `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**Parsing conventions by provider:**
- `greenhouse`: `jobs[]` -> `title`, `absolute_url`
- `ashby`: GraphQL `ApiJobBoardWithTeams` with `organizationHostedJobsPageName={company}` -> `jobBoard.jobPostings[]` (`title`, `id`; build public URL if not in payload)
- `bamboohr`: list `result[]` -> `jobOpeningName`, `id`; build detail URL `https://{company}.bamboohr.com/careers/{id}/detail`; to read full JD, GET detail and use `result.jobOpening` (`jobOpeningName`, `description`, `datePosted`, `minimumExperience`, `compensation`, `jobOpeningShareUrl`)
- `lever`: root array `[]` -> `text`, `hostedUrl` (fallback: `applyUrl`)
- `teamtailor`: RSS items -> `title`, `link`
- `workday`: `jobPostings[]`/`jobPostings` (varies by tenant) -> `title`, `externalPath` or URL built from host

### Level 3 — WebSearch Queries (BROAD DISCOVERY)

`search_queries` with `site:` filters cover portals broadly (all Ashby, all Greenhouse, etc.). Useful for discovering NEW companies not yet in `tracked_companies`, but results may be stale. After filtering hits from `local_parser_ok` companies, remaining results are deduplicated with Levels 0-2.

**Execution priority:**
1. Level 0: Local parser -> companies with `parser:` configured and existing script; build `local_parser_ok`
2. Level 1: Playwright -> `tracked_companies` with `careers_url`, **except** `local_parser_ok`
3. Level 2: API -> `tracked_companies` with `api:`, **except** `local_parser_ok`
4. Level 3: WebSearch -> all `search_queries` with `enabled: true`; discard hits from `local_parser_ok` companies

Levels are additive -- they run in order, results are merged and deduplicated. Companies in `local_parser_ok` **do not** go through Levels 1 or 2; Level 3 only contributes cross-portal discovery (other companies on the same platform).

## Workflow

1. **Read config**: `portals.yml`
2. **Read history**: `data/scan-history.tsv` -> already-seen URLs
3. **Read dedup sources**: `data/applications.md` + `data/pipeline.md`

3.5. **Level 0 -- Local parser** (`scan.mjs`, zero-token):
   Initialize `local_parser_ok = []`.
   Prefer running `node scan.mjs` once to cover all parsers + APIs zero-token; if doing it manually, repeat the following logic.
   For each company in `tracked_companies` with `enabled: true`, `parser.command` and existing script:
   a. Run `parser.command` with `parser.script` + `parser.args` using local execution without shell
   b. Expand `{careers_url}` and `{company}` placeholders in arguments
   c. Read JSON from stdout (`[]`, `{ jobs: [] }`, or `{ results: [] }`)
   d. Normalize each job to `{title, url, company, location}`
   e. Resolve relative URLs against `careers_url`
   f. If parser fails, log error, try ATS API fallback if available, and continue with other companies (**not** added to `local_parser_ok`)
   g. If parser succeeds (steps c-e without fatal error), add `entry.name` to `local_parser_ok` and accumulate jobs in candidates

4. **Level 1 -- Playwright scan** (parallel in batches of 3-5):
   For each company in `tracked_companies` with `enabled: true`, `careers_url` set, and **name not in `local_parser_ok`**:
   a. `browser_navigate` to `careers_url`
   b. `browser_snapshot` to read all job listings
   c. If page has filters/departments, navigate relevant sections
   d. For each job listing extract: `{title, url, company}`
   e. If page paginates results, navigate additional pages
   f. Accumulate in candidate list
   g. If `careers_url` fails (404, redirect), try `scan_query` as fallback and note to update URL

5. **Level 2 -- ATS APIs / feeds** (parallel):
   For each company in `tracked_companies` with `api:` set, `enabled: true`, and **name not in `local_parser_ok`**:
   a. WebFetch API/feed URL
   b. If `api_provider` is defined, use its parser; otherwise infer by domain (`boards-api.greenhouse.io`, `jobs.ashbyhq.com`, `api.lever.co`, `*.bamboohr.com`, `*.teamtailor.com`, `*.myworkdayjobs.com`)
   c. For **Ashby**, POST with:
      - `operationName: ApiJobBoardWithTeams`
      - `variables.organizationHostedJobsPageName: {company}`
      - GraphQL query for `jobBoardWithTeams` + `jobPostings { id title locationName employmentType compensationTierSummary }`
   d. For **BambooHR**, the list only returns basic metadata. For each relevant item, read `id`, GET `https://{company}.bamboohr.com/careers/{id}/detail`, extract full JD from `result.jobOpening`. Use `jobOpeningShareUrl` as public URL if available; otherwise use detail URL.
   e. For **Workday**, POST JSON with at least `{"appliedFacets":{},"limit":20,"offset":0,"searchText":""}` and paginate by `offset` until results are exhausted
   f. For each job extract and normalize: `{title, url, company}`
   g. Accumulate in candidate list (dedup with Level 1)

6. **Level 3 -- WebSearch queries** (parallel if possible):
   For each query in `search_queries` with `enabled: true` (general queries by portal/role -- not dedicated queries for companies with active local parser):
   a. Run WebSearch with the defined `query`
   b. From each result extract: `{title, url, company}`
      - **title**: from result title (before " @ " or " | ")
      - **url**: result URL
      - **company**: after " @ " in title, or extract from domain/path
   c. **Skip** the result if `company` (normalized) matches any name in `local_parser_ok`
   d. Accumulate remaining in candidate list (dedup with Level 0+1+2)

6. **Filter by title** using `title_filter` from `portals.yml`:
   - At least 1 keyword from `positive` must appear in the title (case-insensitive)
   - 0 keywords from `negative` may appear
   - `seniority_boost` keywords give priority but are not mandatory

6b. **Filter by location (optional)** using `location_filter` from `portals.yml`:
   - If `location_filter` block is absent, all locations pass (default behavior)
   - Empty location on a job -> passes (do not penalize missing data)
   - Any keyword from `block` present -> reject (precedence over allow)
   - Empty `allow` -> passes (already passed block)
   - Non-empty `allow` -> must match at least one keyword
   - All matches are case-insensitive substring
   - Location is persisted as 7th column in `scan-history.tsv` for later audit

7. **Deduplicate** against 3 sources:
   - `scan-history.tsv` -> exact URL already seen
   - `applications.md` -> normalized company + role already evaluated
   - `pipeline.md` -> exact URL already pending or processed

7.5. **Verify liveness of WebSearch (Level 3) results** -- BEFORE adding to pipeline:

   WebSearch results may be stale (Google caches results for weeks or months). To avoid evaluating expired offers, verify each new Level 3 URL with Playwright. Levels 1 and 2 are inherently real-time and do not need this verification.

   For each new Level 3 URL (sequential -- NEVER parallel Playwright):
   a. `browser_navigate` to URL
   b. `browser_snapshot` to read content
   c. Classify:
      - **Active**: job title visible + role description + visible Apply/Submit button in main content. Do not count generic header/navbar/footer text.
      - **Expired** (any of these signals):
        - Final URL contains `?error=true` (Greenhouse redirects this way when a job is closed)
        - Page contains: "job no longer available" / "no longer open" / "position has been filled" / "this job has expired" / "page not found"
        - Only navbar and footer visible, no JD content (content < ~300 chars)
   d. If expired: record in `scan-history.tsv` with status `skipped_expired` and discard
   e. If active: continue to step 8

   **Do not interrupt the entire scan if one URL fails.** If `browser_navigate` errors (timeout, 403, etc.), mark as `skipped_expired` and continue with the next.

8. **For each verified new offer that passes filters**:
   a. Add to `pipeline.md` "Pending" section: `- [ ] {url} | {company} | {title}`
   b. Record in `scan-history.tsv`: `{url}\t{date}\t{query_name}\t{title}\t{company}\tadded`

9. **Title-filtered offers**: record in `scan-history.tsv` with status `skipped_title`
10. **Duplicate offers**: record with status `skipped_dup`
11. **Expired offers (Level 3)**: record with status `skipped_expired`

## Title and Company Extraction from WebSearch Results

WebSearch results come in formats: `"Job Title @ Company"` or `"Job Title | Company"` or `"Job Title -- Company"`.

Extraction patterns by portal:
- **Ashby**: `"Senior AI PM (Remote) @ EverAI"` -> title: `Senior AI PM`, company: `EverAI`
- **Greenhouse**: `"AI Engineer at Anthropic"` -> title: `AI Engineer`, company: `Anthropic`
- **Lever**: `"Product Manager - AI @ Temporal"` -> title: `Product Manager - AI`, company: `Temporal`

Generic regex: `(.+?)(?:\s*[@|\u2014\u2013-]\s*|\s+at\s+)(.+?)$`

## Private URLs

If a non-public URL is found:
1. Save the JD in `jds/{company}-{role-slug}.md`
2. Add to pipeline.md as: `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan History

`data/scan-history.tsv` tracks ALL seen URLs:

```
url	first_seen	portal	title	company	status
https://...	2026-02-10	Ashby -- AI PM	PM AI	Acme	added
https://...	2026-02-10	Greenhouse -- SA	Junior Dev	BigCo	skipped_title
https://...	2026-02-10	Ashby -- AI PM	SA AI	OldCo	skipped_dup
https://...	2026-02-10	WebSearch -- AI PM	PM AI	ClosedCo	skipped_expired
```

## Output Summary

```
Portal Scan -- {YYYY-MM-DD}
Queries run: N
Offers found: N total
Title-filtered: N relevant
Duplicates: N (already evaluated or in pipeline)
Expired discarded: N (dead links, Level 3)
Newly added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...

-> Run /career-ops pipeline to evaluate new offers.
```

## careers_url Management

Every company in `tracked_companies` must have `careers_url` -- the direct URL to their jobs page. This avoids looking it up each time.

**RULE: Always use the company's corporate URL; only fall back to the ATS endpoint if no corporate page exists.**

`careers_url` should point to the company's own jobs page whenever available. Many companies use Workday, Greenhouse, or Lever under the hood but expose job IDs only through their corporate domain. Using the direct ATS URL when a corporate page exists can cause false 410 errors because job IDs may differ.

| Correct (corporate) | Incorrect as first choice (direct ATS) |
|---|---|
| `https://careers.mastercard.com` | `https://mastercard.wd1.myworkdayjobs.com` |
| `https://openai.com/careers` | `https://job-boards.greenhouse.io/openai` |
| `https://stripe.com/jobs` | `https://jobs.lever.co/stripe` |

Fallback: if you only have the direct ATS URL, first navigate to the company website and find their corporate jobs page. Use the direct ATS URL only if the company has no corporate page.

**Known patterns by platform:**
- **Ashby:** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse:** `https://job-boards.greenhouse.io/{slug}` or `https://job-boards.eu.greenhouse.io/{slug}`
- **Lever:** `https://jobs.lever.co/{slug}`
- **BambooHR:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Teamtailor:** `https://{company}.teamtailor.com/jobs`
- **Workday:** `https://{company}.{shard}.myworkdayjobs.com/{site}`
- **Custom:** Company's own URL (e.g. `https://openai.com/careers`)

**API/feed patterns by platform:**
- **Ashby API:** `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR API:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail` (`result.jobOpening`)
- **Lever API:** `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor RSS:** `https://{company}.teamtailor.com/jobs.rss`
- **Workday API:** `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**If `careers_url` does not exist** for a company:
1. Try their known platform pattern
2. If that fails, do a quick WebSearch: `"{company}" careers jobs`
3. Navigate with Playwright to confirm it works
4. **Save the found URL in portals.yml** for future scans

**If `careers_url` returns 404 or redirect:**
1. Note it in the output summary
2. Try scan_query as fallback
3. Flag for manual update

## portals.yml Maintenance

- **ALWAYS save `careers_url`** when adding a new company
- Add new queries as interesting portals or roles are discovered
- Disable queries with `enabled: false` if they generate too much noise
- Adjust filter keywords as target roles evolve
- Add companies to `tracked_companies` when you want to follow them closely
- Periodically verify `careers_url` -- companies change ATS platforms
