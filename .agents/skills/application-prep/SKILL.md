---
name: application-prep
description: Customize resume for target role, generate matching cover letter, humanize text, normalize typography, and produce polished PDFs
user-invocable: true
license: MIT
---

# Application Prep — Full Application Workflow

Customizes resume to the target role, generates a matching cover letter, humanizes all text, normalizes typography, and produces polished PDFs.

## Prerequisites

- Portfolio at `~/dev/portfolio/` with career-data.ts, site-copy.ts
- Playwright installed (career-ops has it)
- `tsx` via npx (for importing TypeScript data)
- Evaluation report in `reports/{###}-{company}.md`

## Workflow

### Step 1 — Read Evaluation Report and Portfolio Data

Read these files:
1. Latest evaluation report from `reports/{###}-{company}-{date}.md`
2. `config/profile.yml` — candidate identity
3. `~/dev/portfolio/lib/career-data.ts` — existing resume data
4. `~/dev/portfolio/lib/site-copy.ts` — site copy (for variant positioning)

Extract from report:
- Company name, role title
- Archetype (determines which portfolio variant to use)
- Customization plan (Block E)
- Block H draft answers (3 bullets, why this company)

### Step 2 — Create Resume Override (not portfolio files)

**DO NOT edit portfolio files.** Create an override JSON at `output/{###}-{company}-override.json`:

```json
{
  "subtitle": "Senior Frontend Engineer (matching JD title)",
  "summary": "Rewritten summary targeting this role...",
  "bullets": {
    "crypto-exchange": {
      "0": ["Custom bullet 1", "Custom bullet 2"]
    }
  }
}
```

Override keys:
- **subtitle** — Match JD role title (e.g., "Senior Software Engineer" → "Full Stack Engineer")
- **summary** — Rewrite to emphasize the archetype's key framing
- **bullets** — `{ jobId: { periodIndex: [replacement bullets] } }`. Only specify jobs/periods that need custom bullets. Everything else falls through to portfolio defaults.

### Step 3 — Generate Resume PDF

```bash
node generate-resume-pdf.mjs output/Fabricio-Pirini-{COMPANY}-Resume.pdf --variant=default --override=output/{###}-{company}-override.json
```

The `generate-resume-pdf.mjs` script reads career data from portfolio (via tsx), applies overrides, writes JSON, and renders to PDF via Typst typesetting. No Playwright, no dev server, no heavy npm deps. Uses the same fonts (Roboto + Source Sans 3) and accent color (#0395de). Typst binary at `~/.typst/bin/typst`.

Cover letter also uses the spec-based pipeline:
```bash
node generate-pdf-from-html.mjs output/Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf --body "$(cat output/{###}-{company}-cover-letter.txt)"
```

Or with company name for salutation:
```bash
node generate-pdf-from-html.mjs output/Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf \
  --body-file output/{###}-{company}-cover-letter.txt \
  --company "{COMPANY}" --date "$(date '+%B %d, %Y')"
```

The Typst cover letter uses the same fonts and colors as the resume (Roboto headings, Source Sans 3 body, #0395de accent) for visual consistency.

### Step 4 — Generate Cover Letter

Create cover letter text (NOT HTML — the Typst renderer handles styling). Write plain text paragraphs, separated by double newlines.

The Typst pipeline (`templates/cover-letter.typ`) automatically renders with:
- Roboto headings + Source Sans 3 body (same fonts as resume)
- #0395de accent color
- Matching header with name, subtitle, location, contact row
- A4 format with consistent margins
- No gradient, no borders, clean and minimal

**Structure (plain text paragraphs):**
1. Opening: Why you're excited about THIS company (specific, not generic)
2. Body: Map 2-3 key JD requirements to specific proof points from CV
3. Gap acknowledgment (if any — be direct, offer mitigation)
4. Closing: Call to action

**Content rules:**
- Write ONLY the body paragraphs (2-3 short paragraphs). Do NOT include date, salutation, or signature — the spec renderer adds those automatically.
- Directly quote JD phrases and map to CV achievements
- Be specific: name tools, projects, metrics
- No fluff, no corporate-speak
- 1 page max (about 15-20 lines of body text)

Save the cover letter text to `output/{###}-{company}-cover-letter.txt` for the spec-based pipeline:
```bash
node generate-pdf-from-html.mjs output/Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf \
  --body-file output/{###}-{company}-cover-letter.txt \
  --company "{COMPANY}" --date "$(date '+%B %d, %Y')"
```

**Tip:** The body file should contain only the body paragraphs (no salutation, no date, no signature). The spec adds: header with name/contact, date, salutation (from --company), your paragraphs, and a professional closing.

### Step 5 — Humanize All Text (MANDATORY)

**Every single block of candidate-facing text** MUST go through the humanizer skill before being written to HTML or form fields.

Invoke `/skill:humanizer` on:
- Resume summary
- Resume bullets
- Cover letter body
- Form answers
- LinkedIn messages
- Follow-up emails

The humanizer will catch: AI vocabulary (leveraging, pivotal, foster, etc.), forced "rule of three", negative parallelisms (", not just about X, it's about Y"), vague attributions, promotional language, filler phrases.

### Step 6 — Rewrite Em/En Dashes + Normalize Typography (MANDATORY)

**Rule: ZERO em or en dashes.** Rewrite sentences, don't just replace characters.

After humanizing, check ALL text for em dashes (`—`) and en dashes (`–`). For each one found, **rewrite the sentence** to avoid the dash construction:

```
// Wrong: mechanically replace character
"Reduced runtime 12min to 1min — tripled coverage" -> "Reduced runtime 12min to 1min - tripled coverage"

// Right: rewrite the sentence
"Reduced runtime 12min to 1min — tripled coverage" -> "Reduced runtime from 12 min to under a minute. Coverage tripled."
```

Then normalize typography for remaining characters:

```javascript
function normalizeTypography(text) {
  return text
    .replace(/[\u201C\u201D]/g, '"')    // smart quotes → straight
    .replace(/[\u2018\u2019]/g, "'")    // smart single quotes → straight
    .replace(/\u2026/g, '...')           // ellipsis → three dots
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/\u00A0/g, ' ');            // non-breaking space → space
}
```

**Check:** After writing HTML, grep for `\u2014` or `—` in the output file. If any found, rewrite those sentences and re-render.

### Step 7 — Generate Cover Letter PDF

Use the Typst pipeline (no Playwright, matches resume design):

```bash
node generate-pdf-from-html.mjs output/Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf \
  --body-file output/{###}-{company}-cover-letter.txt \
  --company "{COMPANY}"
```

The cover letter is rendered via Typst using the same fonts and colors as the resume PDF. No react-pdf, no catalog components.

---

**Legacy HTML route** (still works, but less consistent):
```bash
node generate-pdf-from-html.mjs output/Fabricio-Pirini-{COMPANY}-Cover-Letter.html output/Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf
```

### Step 8 — Extract Form Fields + Generate Application Answers

Run the form extractor to open the JD URL, find the Apply page, extract questions, and prepare draft answers:

```bash
node application-form.mjs <jd-url> --report reports/{###}-{company}-{date}.md --output output/{###}-{company}-form-answers.md
```

The script outputs a JSON object with extracted form fields. The LLM then:
1. For each extracted question, generate a tailored answer using career data + evaluation report
2. Write humanized, em-dash-free answers into `output/{###}-{company}-form-answers.md`
3. Present them for the user to review

**If the form extraction fails** (non-standard ATS, login wall, complex multi-page form), fall back to a generic question set:
- Cover Letter / Why are you interested?
- Relevant Experience
- Why this company?
- Salary Expectations
- Work Authorization
- How did you hear about us?

Generate thorough answers for the generic set.

**Output format:**

```markdown
## [Exact form question label] [type] *
> [Draft answer ready for copy-paste]
```

### Step 9 — Present + Update Tracker

Show the user:
1. Resume PDF path
2. Cover letter PDF path
3. Form answers path
4. Ask: "Review these. Copy answers into the form. Ready when you want to submit."

Then update tracker:
```bash
node merge-tracker.mjs
```

Update the existing tracker entry with:
- PDF status: ✅ (resume), ✅ (cover letter)
- Notes: "Application-ready: resume + cover letter + form answers"

### Step 10 — Done (no restore needed)

**No portfolio files were touched.** The override JSON at `output/{###}-{company}-override.json` contains all customizations for this application. No `git checkout` needed.

## Scripts

### generate-resume-pdf.mjs (PREFERRED)

Located in `career-ops/`. Reads career data from portfolio via tsx, applies overrides, writes JSON, calls `typst compile`. Uses same fonts (Roboto + Source Sans 3) and accent (#0395de) as portfolio resume. Requires Typst binary at `~/.typst/bin/typst`.

```bash
node generate-resume-pdf.mjs output/{name}.pdf [--variant=default|growth|product] [--override=<path>]
```

### render-resume-html.mjs (REMOVED)

Deleted. Use `generate-resume-pdf.mjs` via Typst instead.

### generate-pdf-from-html.mjs

Two modes:
- **Spec mode** (preferred for cover letters): Typst typesetting with resume-matching design
- **HTML mode** (legacy): Playwright-based HTML → PDF

```bash
# Spec mode (preferred)
node generate-pdf-from-html.mjs output/letter.pdf --body "Cover letter text..." [--company "Acme Corp"] [--date "May 27, 2026"]

# Spec mode from file
node generate-pdf-from-html.mjs output/letter.pdf --body-file path/to/text.txt --company "Acme Corp"

# HTML mode (legacy)
node generate-pdf-from-html.mjs input.html output.pdf [--format=letter|a4]
```

## Output Files

All go in `career-ops/output/`:

- `{###}-{company}-override.json` — Resume customizations (optional, per-application)
- `Fabricio-Pirini-{COMPANY}-Resume.pdf` — Resume PDF (e.g. `Fabricio-Pirini-Infisical-Resume.pdf`)
- `Fabricio-Pirini-{COMPANY}-Cover-Letter.html` — Cover letter HTML (matches resume design)
- `Fabricio-Pirini-{COMPANY}-Cover-Letter.pdf` — Cover letter PDF
- `{###}-{company}-form-answers.md` — Application form draft answers

## The Rule

**NEVER submit an application.** Generate PDFs, draft answers, prepare materials — but stop before clicking Submit/Send/Apply. The user makes the final call.

## Ethical Check

Score below 4.0? Flag it. Don't waste the user's time on low-fit roles.
