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

### Step 2 — Customize Resume

Apply changes to `~/dev/portfolio/lib/career-data.ts`:

**Subtitle** — Change to match JD role title (e.g., "Senior Software Engineer" → "Full Stack Engineer")

**Summary** — Rewrite to emphasize the archetype's key framing:
- Full Stack → "Full stack engineer who builds developer-facing tools and works directly with customers"
- Growth → "Senior engineer who builds experimentation programs and ships based on data"
- Product → "Product engineer who writes success metrics before writing code"

**Job bullets** — For each company, reorder or rephrase bullets to emphasize:
- The skills the JD asks for
- Direct customer/enterprise communication (if JD emphasizes this)
- Building from scratch, end-to-end ownership (if JD emphasizes bias toward action)

**Skills** — Add a relevant skills row if gaps exist (e.g., "Full Stack" row for full stack roles)

**Variant** — Set `ACTIVE_VARIANT` in `site-config.ts` to match the archetype:
- `default` — Design Engineer, Full Stack, Solutions Architect
- `growth` — Growth, Forward Deployed
- `product` — Product Engineer, PM

### Step 3 — Generate Resume PDF

```bash
node render-resume-html.mjs output/{###}-{company}-resume.html [--variant=default]
node generate-pdf-from-html.mjs output/{###}-{company}-resume.html output/{###}-{company}-resume.pdf
```

The `render-resume-html.mjs` script uses `tsx` to import the actual TypeScript data from the portfolio, then renders a standalone HTML page. No Next.js caching issues.

### Step 4 — Generate Cover Letter

Create a cover letter HTML that **visually matches the portfolio's resume** — use `~/dev/portfolio/app/resume/variants/ResumeContent.tsx` as the source of truth for styling, not the live URL.

**Design spec (match portfolio resume exactly):**
- Body font: Source Sans 3 (loaded from `~/dev/portfolio/public/fonts/source-sans-3-latin.woff2`)
- Heading font: Roboto (loaded from `~/dev/portfolio/public/fonts/roboto-latin.woff2`)
- Accent color: `#0395de` (bright blue)
- Header: Name (Roboto 28px bold, `#111827`), subtitle in small-caps (`#0395de`), location in italic (`#9ca3af`)
- Contact row: lucide SVG icons (mail, linkedin, globe, github) with gray text, separated by `|`
- Section headers: first 3 letters in accent color, rest in dark gray e.g. `<span class="ac">Pro</span>fessional Summary`
- Company names: accent color `#0395de`, Roboto 14px bold
- Job roles: small-caps, gray
- Font size: 11px body
- Print: 2cm padding, max-width 210mm, centered
- No gradient, no borders — clean and minimal

**Structure:**
1. Header: Name (Roboto bold), subtitle (small-caps blue), location (italic gray), contact row with SVG icons
2. Date + Hiring Team
3. Opening: Why you're excited about THIS company (specific, not generic)
4. Body: Map 2-3 key JD requirements to specific proof points from CV
5. Gap acknowledgment (if any — be direct, offer mitigation)
6. Closing: Call to action
7. Signature

**Content rules:**
- Directly quote JD phrases and map to CV achievements
- Be specific: name tools, projects, metrics
- No fluff, no corporate-speak
- 1 page max

### Step 5 — Humanize All Text

Run ALL generated text (resume summary, bullets, cover letter) through the humanizer patterns:

1. Remove em dash overuse → replace with commas or periods
2. Remove AI vocabulary: additionally, crucial, delve, enhance, fostering, leverage, pivotal, showcase, testament, underscore, vibrant
3. Remove negative parallelisms: "It's not just about..., it's..."
4. Remove rule of three where forced
5. Remove vague attributions
6. Vary sentence structure and length
7. Add specificity over abstraction
8. Remove promotional language
9. Replace filler: "in order to" → "to", "due to the fact" → "because"

**Use the humanizer skill:** `/skill:humanizer` on each text block.

### Step 6 — Normalize Typography for ATS

Replace in ALL text before writing to HTML:
- Em dashes (—) → en dashes (–) or hyphens (-)
- Smart quotes ("") → straight quotes ("")
- Ellipsis (…) → three dots (...)
- Zero-width characters → removed

```javascript
function normalizeTypography(text) {
  return text
    .replace(/\u2014/g, '-')     // em dash → hyphen
    .replace(/\u2013/g, '-')     // en dash → hyphen
    .replace(/[\u201C\u201D]/g, '"')  // smart quotes → straight
    .replace(/[\u2018\u2019]/g, "'")  // smart single quotes → straight
    .replace(/\u2026/g, '...')   // ellipsis → three dots
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/\u00A0/g, ' ');    // non-breaking space → space
}
```

### Step 7 — Generate Cover Letter PDF

```bash
node generate-pdf-from-html.mjs output/{###}-{company}-cover-letter.html output/{###}-{company}-cover-letter.pdf
```

### Step 8 — Update Tracker

```bash
node merge-tracker.mjs
```

Update the existing tracker entry with:
- PDF status: ✅ (resume), ✅ (cover letter)
- Notes: "Application-ready: resume + cover letter customized"

### Step 9 — Restore Portfolio Files

```bash
cd ~/dev/portfolio && git checkout -- lib/career-data.ts lib/site-config.ts
```

## Scripts

### render-resume-html.mjs

Located in `career-ops/`. Uses `tsx` to import TypeScript data, renders standalone HTML. No regex-based parsing.

```bash
node render-resume-html.mjs output/{name}.html [--variant=default|growth|product]
```

### generate-pdf-from-html.mjs

Located in `career-ops/`. Simple Playwright-based HTML → PDF generator.

```bash
node generate-pdf-from-html.mjs input.html output.pdf [--format=letter|a4]
```

### customize-resume.mjs

Located in `career-ops/`. Applies customization from evaluation report to portfolio data.

```bash
node customize-resume.mjs reports/{###}-{company}.md output/{name}.pdf
```

## Output Files

All go in `career-ops/output/`:

- `{###}-{company}-resume.html` — Standalone resume HTML
- `{###}-{company}-resume.pdf` — Resume PDF
- `{###}-{company}-cover-letter.html` — Cover letter HTML (matches resume design)
- `{###}-{company}-cover-letter.pdf` — Cover letter PDF

## The Rule

**NEVER submit an application.** Generate PDFs, draft answers, prepare materials — but stop before clicking Submit/Send/Apply. The user makes the final call.

## Ethical Check

Score below 4.0? Flag it. Don't waste the user's time on low-fit roles.
