# Data Contract

Defines which files belong to the **system** (safe to update) and which belong to the **user** (never touched).

## User Layer (NEVER auto-updated)

| File | Purpose |
|------|---------|
| `cv.md` | Your CV in markdown |
| `config/profile.yml` | Your identity, targets, comp range |
| `modes/_profile.md` | Your archetypes, narrative, proof points |
| `portals.yml` | Your customized company list |
| `data/applications.md` | Your application tracker |
| `data/pipeline.md` | Your URL inbox |
| `data/scan-history.tsv` | Your scan history |
| `interview-prep/*` | Your STAR+R stories and company intel |
| `reports/*` | Your evaluation reports |
| `output/*` | Your generated PDFs and overrides |

## System Layer (safe to update)

| File | Purpose |
|------|---------|
| `modes/_shared.md` | Scoring, global rules, writing standards |
| `modes/oferta.md` | Evaluation mode instructions |
| `modes/scan.md` | Portal scanner instructions |
| `modes/apply.md` | Application form assistant instructions |
| `modes/pipeline.md` | Pipeline processing instructions |
| `modes/tracker.md` | Tracker instructions |
| `modes/auto-pipeline.md` | Auto-pipeline instructions |
| `modes/ofertas.md` | Comparison instructions |
| `modes/deep.md` | Deep research prompt |
| `modes/project.md` | Project evaluation instructions |
| `modes/training.md` | Training evaluation instructions |
| `modes/pdf.md` | PDF generation instructions |
| `modes/interview-prep.md` | Interview prep instructions |
| `AGENTS.md` | Agent instructions |
| `*.mjs` | Utility scripts (except user-layer) |
| `providers/*` | Scanner provider implementations |
| `templates/*` | Base templates |
| `fonts/*` | Self-hosted fonts |
| `.agents/skills/*` | Skill definitions |
| `DATA_CONTRACT.md` | This file |

## The Rule

**User layer files are NEVER modified by updates.** System layer files can be replaced.
