# Personal AI career direction analysis prompt

Run this assignment in a fresh OMP session whose working directory is `/home/pirini/dev/career-ops`.

## Mission

Produce decision support for Fabricio's career direction and AI learning strategy. Gather accessible evidence first, conduct the mandatory adaptive interview, then write an evidence-backed analysis for 30-day, 90-day, and 12-month horizons.

Preserve these role views independently:

1. Senior Product IC, first priority.
2. AI Product Builder, close second.

Preserve these strategy branches independently:

1. Strongest employment.
2. Collaborative or independent income.
3. Durable fulfillment.

Never calculate an overall winner across role views or strategy branches. Shared evidence and actions are allowed, but each view and branch keeps its own gates, demand universe, reasoning, confidence, plan, and triggers.

This assignment produces analysis only. Do not execute recommendations, scan for or evaluate new jobs as an application workflow, submit applications, generate application materials, edit trackers, mutate projects, edit portfolio source-of-truth files, or change career data.

## Settled constraints

Treat these as confirmed user values for this run. Cite them as run constraints, not as newly discovered market facts.

- Employment goal: obtain a qualifying remote offer within 90 days.
- Compensation floor: $120K USD annualized total compensation. Contractor work must compensate for benefits, taxes, unpaid time, volatility, and concentration risk.
- Learning and reversible experiment capacity: start at 10 sustainable hours per week.
- Capacity increase rule: add at most 2 hours only after two consecutive weeks of completed search commitments with no reported energy, sleep, or health strain. Hold the new level for two weeks before another increase. A learning-caused missed search commitment or two strain reports returns capacity to 10 hours.
- Budget: at most $150 USD per month unless Fabricio explicitly approves a change.
- Risk posture: employment first and reversible experiments. Reliable employment remains the base until another branch demonstrates repeatable demand.
- Reject management-first roles.
- Reject chronic timezone strain.
- Preserve useful-product work and strong collaboration with capable, constructive peers.
- Full-time employment has a slight preference, but a well-structured contractor role may qualify after risk adjustment.
- Existing remote eligibility and no EOR-only constraints remain hard gates where the source files establish them.
- 30-day success: establish an active qualified interview pipeline, sharpen positioning for both role views, and ship or substantially demonstrate one credible AI product artifact.
- 90-day success: accept or hold a qualifying offer and have demonstrable AI adjacency through an artifact, technical narrative, and interview-ready examples.
- 12-month success: thrive in a strong, well-paid Senior Product IC or AI Product Builder role, build production-grade AI evidence, and validate one collaborative or independent option without requiring it to replace employment.

Do not reopen these settled choices with generic intake questions. Ask only if current evidence reveals a concrete contradiction or a changed user-owned tradeoff.

## Absolute boundaries

You must not:

- run recommendations or take actions from the eventual plan;
- submit an application or click a final submission control;
- create or tailor a resume, cover letter, form answer, or application package;
- change `data/applications.md`, `data/pipeline.md`, reports, project source, portfolio source, or other career records;
- write any file except noncanonical analysis work in `/tmp` and the final canonical analysis under `output/career-direction/`;
- expose secrets, credentials, tokens, authenticated headers, browser profiles, shell history, private contacts, raw OMP logs or databases, employer-confidential material, unrelated personal material, or private repository names, URLs, or code;
- search Fabricio's identity on the public web;
- infer facts from agent prose, prior fit scores, recommendations, generated resumes, or generated application packages;
- fabricate achievements, metrics, preferences, market claims, probabilities, causes, or evidence;
- silently shrink scope, omit a required surface, combine branches, combine role views, or turn missing evidence into evidence of inability.

Public research may cover labor markets, companies, job postings, technologies, tasks, and methods. Authenticated GitHub access may inspect repositories already available to Fabricio, subject to the privacy rules above.

## Required OMP skills and order

Load each skill before the phase that uses it.

1. Read `skill://domain-modeling` before defining run-local terms, schemas, and taxonomies. Use its vocabulary discipline only. Keep terms in the run draft and final analysis. Do not create or edit a repository context file, domain file, or ADR.
2. Read `skill://dispatching-parallel-agents` before any parallel work.
3. Every external research slice must read and follow `skill://research` for primary-source discipline and return evidence cards, not recommendations. For this run, do not create the skill's usual repository research file. Return cards to the controller for the noncanonical draft.
4. Read `skill://grilling` before the adaptive interview. Use `skill://domain-modeling` during the interview when a term or contradiction needs sharpening.
5. Read `skill://humanizer` before revising candidate-facing narrative, positioning, plain-language, and action text.
6. After a complete draft exists, use read-only reviewers. Reviewers report findings only. The controller owns repairs and the final file.

Do not use Wayfinder scratch files or this prompt's creation conversation as evidence. This prompt contains the execution contract.

## Phase 0: preflight and frozen contracts

Run these steps sequentially.

1. Load repository instructions, especially `AGENTS.md`, and respect the career-ops data contract.
2. Run `node cv-sync-check.mjs` from `/home/pirini/dev/career-ops`.
3. Treat these as required startup sources:
   - `cv.md`
   - `config/profile.yml`
   - `modes/_profile.md`
   - `portals.yml`
   - `/home/pirini/dev/portfolio/lib/career-data.ts`
4. Treat these as expected evidence surfaces that may be empty or absent without failing preflight. Record their status and reason:
   - `interview-prep/story-bank.md`
   - `data/applications.md`
   - `data/pipeline.md`
   - `data/scan-history.tsv`
   - `reports/`
   - `output/`
   - `/home/pirini/dev/portfolio/lib/site-copy.ts`
   - allowed project roots under `/home/pirini/dev/`
   - authenticated GitHub inventory
   - sanitized `history://` and `agent://` evidence
   - external market sources
5. A missing required source is a hard blocker for every claim in its authority domain. Never substitute a subordinate copy silently. A warning from `cv-sync-check.mjs` about an optional source is not a reason to stop unrelated work.
6. Set the analysis date using UTC-3. Freeze one evidence cutoff timestamp at discovery start. Record a run revision.
7. Select the canonical output path without creating it yet:
   - first choice: `output/career-direction/YYYY-MM-DD-career-direction-analysis.md`;
   - if it exists, choose the lowest unused `-rN` suffix;
   - never overwrite an existing file.
8. Select a noncanonical draft path under `/tmp`. Keep every draft there until all hard checks pass.
9. Initialize a scope ledger. It must enumerate every required evidence surface, both role views, all three branches, all three horizons, every main-body deliverable, Appendices A through H, and the quality report. Status values are `pending`, `pass`, `blocked`, `unassessed`, or `excluded-with-reason`.
10. Initialize these run-local schemas before reading deeply:
    - source manifest;
    - posting and requirement extraction;
    - evidence card;
    - unresolved item;
    - interview ask log and record;
    - exclusion log;
    - shared action and dependency ledger;
    - scope ledger;
    - quality report.
11. Install the privacy denylist from Absolute boundaries. Verify authenticated tools without printing credentials.
12. Freeze canonical IDs, duplicate keys, dependency-family rules, source authority, freshness gates, role taxonomy, demand universes, evidence labels, confidence labels, weighting constants, and disjoint agent assignments before parallel work.

Do not proceed to the interview until the automatic evidence checkpoint passes or identifies every blocker.

## Source authority and evidence rules

### Claim-specific authority

Use authority only for the claim domain a source can establish.

| Claim domain | Governing evidence | Subordinate or derived evidence |
|---|---|---|
| Employment history, role periods, achievements, metrics | `/home/pirini/dev/portfolio/lib/career-data.ts` | `cv.md`, resume variants, output packages, reports, agent summaries |
| Preferences, constraints, intent, archetypes, framing | Latest explicit interview statement, then `config/profile.yml` and `modes/_profile.md` | Older profile wording, application positioning, agent inference |
| Application states and outcomes | `data/applications.md` | Reports, output packages, inferred explanations |
| Demonstrated skills and authored decisions | Attributable project source, commits, decisions, and shipped artifacts | Metadata, learning records, descriptions, agent activity, self-report |
| Current job demand | Deduplicated direct employer postings with explicit eligibility | Reports, aggregators, exact-title counts, application volume |
| External market, adoption, task, and outcome claims | Cited primary or first-party research appropriate to the construct | Vendor headlines, forecasts, social attention, stars, downloads, uncited trend prose |

One governing canonical source is sufficient inside its authority. One direct user statement is sufficient for subjective preferences, intent, constraints, and corrections. A factual user correction remains `user-stated` until canonical evidence agrees.

Lower-authority evidence may qualify governing evidence but cannot silently overrule it. Reports, generated packages, resume views, and agent prose do not independently corroborate their own inputs.

### Conflict resolution

First verify that conflicting sources address the same claim and construct. Then compare, in order:

1. claim-domain authority;
2. provenance and attributable ownership;
3. observation date, not publication or filesystem modification date alone;
4. specificity to person, role, task, geography, and population;
5. independence from shared inputs or datasets.

Never average incompatible metrics, fit scores, populations, geographies, observation windows, model vintages, or evidence states. Show support and counter-evidence side by side. A material residual conflict becomes `Unresolved`, lowers dependent confidence, names evidence needed for resolution, and blocks only conclusions that require the disputed fact.

### Claim-specific recency

- Preferences and constraints: latest dated explicit statement. A live interview answer overrides older profile wording.
- Verified career history: no expiry. Later canonical corrections supersede older copies.
- Demonstrated skills: `current` through 18 months, `recent` from 19 through 36 months, and `historical` beyond 36 months. Attributable maintenance or use refreshes recency.
- Application reports: last 90 days have current-market weight. Older reports are longitudinal context.
- Live employer postings: retrieve during analysis and normally require observation within 30 days.
- High-frequency posting or business series: latest point normally within 90 days, with rolling window and revisions retained.
- Quarterly telemetry: latest two comparable quarters.
- Annual statistics and surveys: latest completed release plus prior comparable release.
- Structural projections and task taxonomies: latest official vintage with stated horizon.
- Experiments: record study date, model and tool vintage, population, tasks, sample, outcome, and uncertainty. Newer tools do not silently invalidate or generalize older results.

Evidence outside its gate remains `stale context` with no current weight.

### Corroboration and confidence

- One attributable artifact supports only `demonstrated once`.
- Repeated, current, or professional proficiency requires two distinct evidence types.
- Application outcomes establish events, not causes.
- Every material market claim requires at least two independent owners and two method classes.
- Every material career recommendation requires at least one personal-evidence card and one market-evidence card, plus counter-evidence.
- Two publications using the same posting corpus, survey panel, telemetry, or study count as one evidence family.

Assign exactly one confidence label to every material claim:

- `High`: governing evidence is authoritative, current where needed, corroborated where required, and free of unexplained contradiction.
- `Moderate`: credible evidence with one source, partial corroboration, or material scope limits.
- `Low`: indirect, stale, narrow, weakly attributable, or self-reported evidence outside subjective domains.
- `Unresolved`: insufficient or materially conflicting evidence.

External trend claims also receive `durable`, `weak`, or `hype/rejected`:

- `durable` requires independent owners and methods, persistence, explicit scope and denominators, deduplication, addressability, and no unexplained contradiction;
- `weak` means real but narrow, short-lived, selected, concentrated, or methodologically dependent;
- `hype/rejected` cannot support decisions.

Market-signal durability does not determine confidence in a personal claim.

### Fact, value, inference, and unresolved labels

Every material statement in the analysis starts with exactly one label:

- `Fact`: directly supported inside source authority.
- `User value`: latest explicit preference, intent, constraint, or correction.
- `Inference`: narrow reasoning from cited evidence. State the inference step and a falsifier.
- `Unresolved`: insufficient or conflicting evidence. State effect and resolution path.

Self-reported skills and achievements stay `user-stated` until corroborated. Tutorials, learning notes, one commit, one tool invocation, or agent activity cannot establish production proficiency. Agent activity can establish only that the recorded action occurred.

### Evidence cards and citations

Every material claim cites an evidence-card ID. Use bidirectional links between each main-body claim or recommendation and its appendix card.

Each evidence card records:

```yaml
evidence_id:
evidence_type: personal | market | interview | project | application
claim_domain:
source_class:
owner_or_author:
visibility: public | private_redacted | local_private
canonical_pointer:
publication_date:
observation_period:
retrieval_date:
method:
population_or_scope:
geography:
role_or_task_mapping:
metric_and_denominator:
dependency_family:
minimum_support:
limitations: []
counter_evidence: []
confidence: High | Moderate | Low | Unresolved
supports: []
```

Public market cards use direct primary or first-party URLs. Local cards use safe canonical paths. Private cards use opaque IDs and minimum sanitized support. Direct user statements cite interview date and question ID. Application reports cite the local report path and original employer URL but remain derived analysis.

Each material conclusion returns support, counter-evidence, the narrowest warranted conclusion, a falsifier, and the next useful update point.

## Phase 1: deterministic discovery and manifests

Discovery order is fixed.

1. Read canonical personal authority, in this order:
   - `/home/pirini/dev/portfolio/lib/career-data.ts`, read-only;
   - `config/profile.yml`;
   - `modes/_profile.md`;
   - `cv.md`;
   - `interview-prep/story-bank.md` if present.
2. Inspect career-process evidence:
   - `data/applications.md`;
   - `data/pipeline.md`;
   - `data/scan-history.tsv`;
   - every real target-role file under `reports/`;
   - generated packages under `output/` as derived views only.
3. Inventory allowed local project roots under `/home/pirini/dev/` metadata-first. Record remotes, canonical commit SHA, and worktree, fork, mirror, generated, or upstream provenance. Exclude unrelated personal directories.
4. Reconcile with authenticated GitHub. Add remote-only repositories. Collapse clones, mirrors, forks, split copies, templates, upstream-only code, and worktrees. Give private repositories opaque IDs.
5. Inventory sanitized OMP activity through `history://` and `agent://`. Never read raw logs, databases, WAL files, backups, credential stores, or shell history.
6. Discover external evidence by construct: official baselines, direct eligible vacancies, adoption and task-use evidence, bounded outcome studies, then transparent surveys. Search markets and companies only.
7. Deeply inspect projects only after project deduplication. Select a representative set transparently for role-view proof, branch value, recency, interest or traction, and uncertainty reduction. Keep every other project in the complete manifest as `Unassessed`.

Every source-manifest row records:

```yaml
source_id:
surface:
format:
safe_canonical_pointer:
authority_domain:
visibility:
provenance:
modified_or_commit_time:
observation_date:
retrieval_date:
freshness_state:
access_state:
access_reason:
duplicate_key:
dependency_family:
assigned_slice:
inspection_depth:
exclusion_reason:
safe_citation:
```

Populate `format` and `modified_or_commit_time` before deep inspection, or mark either field explicitly unavailable with a reason. The automatic evidence checkpoint must fail the pre-deep-read inventory step when either field is silently empty.

### Deduplication

- Jobs: canonical employer plus ATS requisition ID. If unavailable, use canonical employer URL and normalized requisition path. Last fallback is employer, normalized title, normalized geography, first-seen window, and description fingerprint.
- Posting views: attach every scan, report, tracker row, copied URL, and generated package to a view registry under one posting identity. Collapse exact URLs, tracking variants, mirrors, and duplicate descriptions into views, not demand observations.
- Reposts and revisions: retain an unchanged repost under the same identity when duties, location, and requisition lineage remain substantially unchanged. Create a linked `posting_revision` when scope, duties, geography, eligibility, or requisition lineage changes materially. Preserve first seen, last seen, closed, repost, and revision events for trend work.
- Identity validation must prove that exact copies and URL variants add no observation, unchanged reposts retain one identity, materially changed reposts create one linked revision, and genuine same-employer requisitions remain distinct.
- Projects: canonical remote or root plus commit SHA and fork lineage.
- OMP evidence: transcript or artifact identity.
- Corroboration: underlying dataset or evidence family.
- Derived resumes, reports, packages, mirrors, publications sharing a dataset, and agent summaries do not corroborate their inputs.

Include every real target-role report, including closed, rejected, discarded, or skipped roles. Exclude hypothetical, duplicate-only, malformed beyond recovery, fabricated, illegitimate, or clearly irrelevant records with reason codes. Quarantine ambiguous identity, source text, date, legitimacy, or format drift.

Application outcomes are events only. Do not claim rejection or silence was caused by a skill, title, location, resume choice, or market condition unless direct employer evidence states the cause.

## Pinned PENDING_REVIEW research input

Use this research asset as an evidence input, not as settled truth:

- branch: `research/current-ai-hiring-evidence`
- commit: `33cd88692e9c06cfe15035926a5b1ffd8f35a488`
- path: `research/personal-ai-career-prompt/current-ai-hiring-evidence.md`
- state: `PENDING_REVIEW`, not Merge Ready

Read the immutable file from `/home/pirini/dev/career-ops` without checking out or changing branches:

```bash
git show 33cd88692e9c06cfe15035926a5b1ffd8f35a488:research/personal-ai-career-prompt/current-ai-hiring-evidence.md
```

Verify the command succeeds before using the asset. If the commit or path is unavailable, record the asset as inaccessible, retry the exact retrieval once, then use independent primary research for each required construct. Do not copy an unverifiable claim from another summary. Do not claim this asset is Merge Ready.

## External market constructs

Keep these constructs separate:

- employment stock;
- vacancy flow;
- eligible remote vacancy;
- application pressure;
- enterprise adoption;
- task exposure;
- observed task use;
- productivity;
- delivery outcomes;
- ecosystem activity.

Use this hierarchy:

1. Official statistics and representative surveys for structural labor, wage, task, and adoption baselines.
2. Direct administrative and behavioral evidence for addressable vacancies, application behavior, product usage, repository activity, and delivery outcomes.
3. Bounded causal or quasi-experimental studies for only their studied population, task, tool, and period.
4. Transparent voluntary surveys for role, experience, and sentiment slices, not population prevalence or causality.
5. Vendor claims, forecasts, announcements, funding, stars, downloads, and social attention only as discovery inputs.

A material market claim needs two independent owners and two method classes. Keep exposure separate from adoption or displacement, perception separate from measured outcome, and ecosystem attention separate from paid hiring.

## Weighted job demand and skill-gap method

Apply this method reproducibly. Publish all constants, taxonomy versions, transformations, exclusions, and denominators.

### Role lanes and role views

Minimum task-based lanes:

- Frontend Product Engineering;
- Design Systems and UI Platform;
- Growth Product Engineering;
- Full Stack Product Engineering;
- Developer Experience and Developer Platform;
- AI Product Engineering overlay.

Titles are hints. Duties determine a posting's primary lane, secondary lanes, and role-view relevance from 0 to 1. Publish strict-title and task-expanded counts separately.

Publish the versioned role and requirement dictionary with every result. Include title hints, task definitions, normalized capability clusters, raw-term mappings, qualifiers, inclusions, exclusions, role-lane rules, and compatibility mappings. A dictionary change requires re-extraction or a documented compatibility map before windows are compared.

`Senior Product IC` combines task-relevant evidence from the first five lanes. `AI Product Builder` remains separate and requires product delivery plus explicit AI duties. An AI employer, AI product description, or generic AI mention cannot create AI Product Builder relevance.

### Demand universes

Keep four universes separate:

1. `current addressable`: direct posting rechecked during analysis, normally within 30 days, with explicit eligibility for geography, work model, UTC overlap, and compensation constraints.
2. `current unclear`: relevant and current, but one or more eligibility fields remain unclear. Never promote it to addressable.
3. `ineligible comparison`: legitimate and relevant but unavailable under hard constraints. Use only for broad-market comparison.
4. `longitudinal context`: older, closed, rejected, or no longer live. Use for persistence and taxonomy checks, not current vacancy counts.

A rejected input has zero weight. Missing observation date gives no current-market weight. Non-skill eligibility fields never become skill gaps.

### Posting extraction

Every posting record retains raw source text and contains:

```yaml
posting_identity:
posting_revision:
employer_identity:
report_paths: []
canonical_employer_url:
ats_requisition_id:
first_seen:
last_seen:
posting_status: live | closed | unknown
legitimacy: verified_direct | direct_closed | derived_only | reject
legitimacy_reason:
geography_raw:
geography_eligibility: eligible | unclear | ineligible
utc_compatibility: compatible | unclear | incompatible
employment_model: employee | contractor | either | unclear
compensation_eligibility: eligible | unclear | ineligible
authorization_eligibility: eligible | unclear | ineligible
travel_eligibility: eligible | unclear | ineligible
seniority_eligibility: eligible | unclear | ineligible
eligibility_gate_state: Pass | Fail | Unresolved
seniority:
primary_lane:
secondary_lanes: []
view_relevance:
  senior_product_ic: 0.0
  ai_product_builder: 0.0
requirements:
  - raw_quote:
    source_pointer:
    canonical_capability:
    requirement_class: hard_eligibility | core | duty | preferred | context | marketing
    explicitness: 0.0
    required_depth: awareness | working | production | leadership
    years_required:
    ai_expectation: none | tool_use | product_integration | model_data | evaluation_safety | operations | domain_only
    extraction_confidence: 0.0
format_version:
parser_result: parsed | partial | quarantined
review_notes: []
```

Normalize employer variants while preserving raw values. Preserve alternatives and qualifiers such as `or similar`, `familiarity`, and optional wording. One capability contributes at most once per posting. Repeated terms may raise extraction confidence but never demand weight. A taxonomy version change requires re-extraction or a documented compatibility map.

### Requirement classes

- `hard_eligibility`: geography, authorization, compensation, employment model, timezone, travel, or seniority gate;
- `core`: explicitly required and central;
- `duty`: recurring work the hire must perform;
- `preferred`: explicit nice-to-have or differentiator;
- `context`: named stack or domain without demonstrated depth requirement;
- `marketing`: company or product language without candidate expectation.

Route every `hard_eligibility` record to its normalized eligibility field, the `Pass`, `Fail`, or `Unresolved` gate state, and the correct addressability universe. It has zero requirement weight and never contributes to a capability demand share or candidate skill gap. Preserve its raw quote and qualifier. Validation must prove that authorization, travel, seniority, geography, compensation, employment model, and timezone failures cannot enter current addressable demand or learning rankings.

### Weighting

For posting `p`, role view `v`, and universe `u`:

```text
w[p,v,u] = R[p] * L[p] * G[p,u] * V[p,v] * X[p]
```

Constants:

- Recency `R`: `1.00` for 0 to 30 days, `0.70` for 31 to 90, `0.35` for 91 to 180, `0.10` beyond 180.
- Legitimacy `L`: `1.00` verified direct, `0.75` known direct but closed, `0.40` derived-only with recoverable identity, `0` rejected.
- Universe membership `G`: `1` only in the separately reported addressable, unclear, ineligible, or longitudinal universe being calculated, otherwise `0`.
- Task-based role-view relevance `V`: `0` to `1`.
- Extraction confidence `X`: `0.5` to `1`. Below `0.5` is quarantined.

Requirement contribution for capability `s`:

```text
c[p,s,v,u] = w[p,v,u] * K[p,s] * E[p,s]
```

- Requirement class `K`: `0` hard eligibility, `1.00` core, `0.80` duty, `0.60` preferred, `0.30` context, `0` marketing.
- Explicitness `E`: `0.5` inferred but reviewable through `1.0` directly stated. Below `0.5` remains unresolved.

Within each employer, use the maximum capability contribution across its requisitions. The employer denominator uses that employer's maximum posting weight. This caps one employer at one employer-equivalent per capability while preserving genuine requisitions in raw counts.

Weighted demand share:

```text
D[s,v,u] = sum over employers e of max c[p,s,v,u] for postings p at e
           divided by
           sum over employers e of max w[p,v,u] for postings p at e
```

Always publish raw report count, unique posting count, unique employer count, duplicate count, repost count, unresolved identity count, weighted numerator and denominator, employer and requisition counts mentioning the capability over their full denominators, missing and quarantined records, ATS and source concentration, and strict-title versus task-expanded results.

A zero or missing denominator returns `insufficient denominator`, never `0% demand`, prevalence, a trend, or a learning rank. A weighted share describes only the curated sample.

### Demand confidence

- `High`: at least 8 unique employers, at least 80 percent direct-source coverage, no employer above 20 percent of uncapped sample weight, at least 90 percent reviewed extraction agreement, a current denominator, and no unresolved material contradiction.
- `Moderate`: at least 3 unique employers with direct evidence and one important scope, concentration, geography, extraction, or freshness limitation.
- `Low`: one or two employers, derived-only evidence, unstable taxonomy, missing denominator components, high concentration, or stale context.
- `Unresolved`: material conflict, absent denominator, incompatible windows, or insufficient identity or eligibility evidence.

Vary each nonbinary weight by plus or minus 20 percent. A learning priority is stable only if it remains in the same rank band across plausible settings.

Validate extraction before ranking. Independently double-review at least 10 percent of postings and every high-impact ambiguous record. Publish field-level agreement and adjudications. Also test report format drift, exact duplicates, URL variants, reposts, same-employer requisitions, eligibility-universe changes, repeated keywords, qualifiers, generic AI branding, absent personal evidence, and plus or minus 20 percent sensitivity. Every aggregate must drill down to posting identities, raw quotes, transformations, exclusions, and denominator changes.

### Candidate evidence states

Match every capability at the narrowest supported depth and context.

- `Demonstrated`: an attributable artifact directly shows the capability at or above required depth. One artifact means only `demonstrated once`.
- `Adjacent`: evidence shows a transferable parent or sibling capability, not the requested context.
- `Weak evidence`: direct or adjacent evidence exists, but depth, recency, scope, outcome, or corroboration is missing.
- `Missing evidence`: the complete eligible inventory has no qualifying direct or adjacent evidence. Say `missing evidence for X`, never `cannot do X`.
- `Unassessed`: a relevant surface was unavailable, unsafe, or not reviewed. No gap severity and no learning rank.
- `Conflict`: sources materially disagree. Mark `Unresolved` and block the dependent recommendation.

Keep these stronger demonstrated-ability anchors available for scenario profiles: `Repeated professional proof`, `Multiple current attributable proofs`, `Demonstrated once`, `Adjacent`, `Missing evidence`, `Unassessed`, `Conflict`.

### AI duty classification

Count an AI expectation only when raw employer text establishes one class:

1. `tool_use`: expected coding-agent or AI-assisted workflow use;
2. `product_integration`: building AI-backed user features or workflows;
3. `model_data`: model selection, prompting, retrieval, data pipelines, fine-tuning, or model behavior work;
4. `evaluation_safety`: evaluation, quality, red teaming, privacy, safety, or governance;
5. `operations`: cost, latency, reliability, observability, deployment, or incident ownership for AI systems;
6. `domain_only`: employer sells AI but the role has no explicit AI duty.

`domain_only` and marketing have zero requirement weight. `tool_use` alone does not prove AI product-building demand. AI Product Builder relevance rises only from explicit product integration, model or data, evaluation and safety, or operations duties.

Analyze credible AI specialization adjacencies only after combining explicit market duties with Fabricio's attributable evidence, constraints, and interview record. Do not preselect a specialization. For each candidate specialization, show role-view fit, branch value, evidence state, learning cost, proof path, counter-evidence, confidence, and falsifier.

### Trend gate

One batch is a snapshot, not a trend. A trend requires:

- the same taxonomy version or documented compatibility mapping;
- at least three comparable observation windows spanning at least 90 days;
- at least 20 unique employers per compared addressable window;
- stable geography, seniority, role-view, and collection-source definitions;
- unique-employer and unique-requisition denominators for every window;
- concentration checks;
- additions, removals, and reposts preserved.

Use `emerging candidate signal` only when a capability appears across at least three independent employers, rises in two consecutive comparable windows, gains at least 5 percentage points and 1.5 times its baseline share, and remains directionally stable under sensitivity analysis. Otherwise use `persistent`, `declining candidate`, `pulse`, or `insufficient longitudinal evidence`. Any material trend also needs an independent owner and method class. Never infer hiring, rejection, productivity, adoption, or displacement causes from posting movement.

### Branch-specific learning priorities

Rank only assessed weak or missing evidence. Produce six distinct tables: two role views multiplied by three strategy branches.

```text
P[s,v,b] = D[s,v,u] * G[s] * C[s,v] * A[s,b] * Q[s] * T[s] / H[s]
```

- `D`: weighted demand share in the relevant universe.
- Gap severity `G`: `0` demonstrated, `0.55` weak, `1.0` missing.
- `C`: role criticality from requirement class and required depth.
- `A`: branch-specific addressability and urgency. Employment uses addressable demand and receives highest 90-day weight. Collaborative or independent work requires separately validated buyer or collaborator demand. Durable fulfillment requires explicit preference evidence and cannot substitute market demand for personal value.
- Confidence discount `Q`: `1.0` High, `0.75` Moderate, `0.45` Low, and no rank when Unresolved.
- `T`: transfer and proof return, including cross-lane transfer and credible evidence achievable within 30 or 90 days.
- `H`: realistic learning or proof hours under capacity and budget.

Do not display the raw decimal priority as a decision. Use sensitivity-tested rank bands. Return one action type: `prove`, `practice`, `learn`, `defer`, or `resolve constraint`. A low-confidence result authorizes evidence collection or a reversible experiment only. An Unresolved result blocks ranking.

## Safe parallel execution

The controller completes preflight, schemas, privacy freeze, metadata inventory, identity reconciliation, and deduplication sequentially. Only then may it invoke `dispatching-parallel-agents`.

Allowed disjoint read-only slices:

- canonical project inspections, with each project ID assigned exactly once;
- external research split by construct and evidence family;
- report extraction batches split by posting identity;
- sanitized OMP-history batches split by transcript or artifact ID;
- post-draft reviews split into provenance and links, privacy and secrets, branch and role preservation, constraint and capacity, and generic wording, repetition, and precision.

Every agent receives exact assigned IDs, frozen cutoff, allowed tools, privacy denylist, output schema, and stop rule. Agents must not ask the user, choose preferences, recommend a branch, merge evidence, edit source files, edit drafts, edit the canonical file, or inspect outside their assigned IDs.

Each agent returns:

- inspected IDs;
- evidence cards with minimum safe support;
- exclusions and reasons;
- contradictions;
- access or tool failures;
- newly discovered duplicate links.

Private project inspection returns only opaque project IDs and aggregate minimum proof. The controller rejects lossy summaries, duplicate cards, ungrounded claims, missing assigned IDs, and conflicting edits. The controller alone reconciles evidence families, duplicates, contradictions, unresolved items, and final prose.

Keep these steps sequential: preflight, schema and privacy freeze, metadata inventory, identity reconciliation, deduplication, conflict adjudication, interview queueing, interview questions, interview-record confirmation, synthesis, capacity allocation, repairs, canonical delivery, and completion proof.

## Deterministic failure behavior

- Tool failure: correct parameters and retry once, then use one genuinely independent alternate tool, source, or method. Record attempts and exact effects. Never loop or invent fallback facts.
- Missing canonical source: mark inaccessible, block dependent facts, and do not substitute a subordinate copy. If neither governing personal evidence nor a confirmed user record can support personalization, stop before analysis.
- Inaccessible private repository: mark `Unassessed` and block only dependent project or skill claims.
- Stale evidence: retain as `stale context` with no current weight.
- Contradiction: apply the conflict sequence. Never average incompatible evidence. Residual conflict is `Unresolved`.
- Insufficient denominator: return `insufficient denominator`. Do not produce prevalence, trend, or ranked learning advice.
- Failed external research: record failed surface and affected construct. A material market claim remains `Unresolved` without two independent owners and methods. If no material recommendation can meet personal plus market corroboration, do not create a canonical deliverable.
- Sensitive deferral: a deferral is not evidence. Block only dependent conclusions.
- Blocked conclusion: record forbidden assumption, affected actions, owner, exact unblocking evidence, confidence effect, and next update point.
- Scope change: add newly discovered items to the scope ledger before continuing. Nothing silently disappears.

Freeze the evidence cutoff at discovery start. Refresh only a retrieval that failed, evidence already outside its freshness gate, or evidence newly contradicted before delivery. Record each exception.

## Automatic evidence checkpoint

Before interviewing, verify:

- every scope-ledger source surface has a status and reason;
- every manifest row has access, freshness, privacy, duplicate, dependency-family, and assignment states;
- every assigned ID returned exactly once;
- jobs, projects, OMP artifacts, and evidence families were deduplicated;
- current demand has eligible, unclear, ineligible, and longitudinal universes;
- each weighted output has denominator readiness;
- no private or unsafe field entered an evidence card;
- tool-answerable gaps were investigated;
- the unresolved-item register is complete.

Present a concise coverage summary. If an admitted user-owned question exists, include only the first question after the summary. Pause only for that question or a hard blocker.

## Mandatory adaptive interview

### Unresolved-item register

Maintain stable, deduplicated items with this schema:

```yaml
unresolved_id:
normalized_proposition:
category:
affected_decision:
horizons: []
branches: []
role_views: []
evidence: []
contradiction:
answer_owner: tool | user | mixed
sensitivity: low | medium | high
materiality_score:
status: discovered | investigated | admitted | asked | answered | deferred | resolved | unresolved
forbidden_assumption:
resolution_path:
```

Tools own factual gaps and objective evidence contradictions. The user owns material preference decisions, value conflicts, changed or subjective constraint tradeoffs, and motivation uncertainty. Mixed cases require tool investigation first. Never ask for a fact tools can answer.

### Materiality scoring

Score each unresolved item from 0 through 100:

- decision effect: 30 percent;
- hard constraint or 30-day and 90-day urgency: 25 percent;
- branch and horizon reach: 20 percent;
- expected uncertainty reduction: 15 percent;
- downside of a wrong assumption: 10 percent.

Admit only user-answerable items scoring at least 60. Always admit a hard-constraint conflict or user decision that blocks a material conclusion. Prioritize blocked 90-day employment conclusions, then broader branch reach, higher score, and lower sensitivity burden. Never force a minimum question count.

### Question loop

1. Ask only the highest-priority atomic question.
2. State it neutrally.
3. Add a clearly labeled `Recommended answer, not fact` with evidence and assumptions.
4. State the strongest alternative.
5. Allow Fabricio to accept, modify, reject, or defer.
6. After the answer, update only affected evidence cards, contradictions, confidence, dependent conclusions, branches, and queue scores.
7. Record a stable question ID and ask-log entry so the proposition is not repeated.
8. Ask a follow-up only when it is distinct and independently meets admission rules.
9. Do not bundle questions. Do not synthesize final recommendations during the interview.

A recommendation in the interview is advice, never evidence or a presumed user answer.

For sensitive questions, explain purpose, affected conclusion, minimum needed scope, and handling. Permit a boundary-limited answer or deferral. Never turn a deferral into an assumption.

Show contradictions side by side with provenance. Investigate factual conflicts before asking. Ask the user only when resolution belongs to subjective intent or correction. User factual corrections remain `user-stated` until corroborated.

### Interview stop and confirmation

Stop questioning only when all conditions hold:

- the evidence pass is complete;
- no admitted queue item remains;
- each admitted user-owned item is answered or explicitly deferred;
- every material contradiction is resolved or labeled `Unresolved`;
- each dependent conclusion is supported or blocked;
- all three strategy branches remain represented;
- no new item meets admission rules.

A lower-scored, tool-inaccessible, branch-local nonblocking, sensitive-deferred, or evidentially irresolvable item may remain only with its label, reason, affected conclusions, confidence effect, forbidden assumption, and next resolution path. If the queue is initially empty, ask no generic intake question.

Present the complete interview record with answers, evidence, superseded statements, contradictions, confidence changes, deferrals, unresolved items, blocked conclusions, and preserved branches. Ask Fabricio to confirm explicitly that the record is accurate and sufficient. Do not begin synthesis until he confirms. A correction reopens only affected items. Unresolved uncertainty blocks dependent conclusions, not unaffected analysis.

## Scenario decision model

Do not calculate a cross-branch total, decimal fit score, probability, or overall winner.

### Branches and gates

1. `Strongest employment`: qualifying Senior Product IC paths first and AI Product Builder paths close second, optimized for a sustainable remote offer within 90 days.
2. `Collaborative or independent income`: bounded paid collaborations, consulting, products, or services. Early experiments validate demand without replacing employment.
3. `Durable fulfillment`: useful-product building, capable constructive peers, autonomy, sustainable energy, and intrinsic pull.

Global gates reject management-first work, chronic timezone strain, nonqualifying remote arrangements, evidence or privacy violations, and credible chronic fulfillment harm. Employment requires at least $120K USD annualized total compensation.

Income has two stages:

- Stage 1 experiments must fit employment-first commitments, current weekly capacity, the monthly budget, and reversibility.
- Stage 2 replacement review requires three consecutive months of net revenue annualizing above the contractor-adjusted compensation floor, at least two independent customers or demand channels, and no customer above 70 percent. Crossing the gate starts a user checkpoint, not a switch.

Durable fulfillment has no immediate income floor unless it proposes replacing employment. Its chronic-harm gate applies everywhere.

Apply each gate as `Pass`, `Fail`, or `Unresolved`.

### Anchored ordinal criteria

Use only these anchors:

- Employability speed: `0-30`, `31-90`, `91-180`, `181+ days`, `Unresolved`.
- Compensation: `Below gate`, `Meets gate`, `Clearly above`, `Unresolved`.
- Demonstrated ability: `Repeated professional proof`, `Multiple current attributable proofs`, `Demonstrated once`, `Adjacent`, `Missing evidence`, `Unassessed`, `Conflict`.
- Learning cost: `Fits 10 hours/$150`, `Fits approved stepped increase`, `Displaces search or exceeds budget`, `Unresolved`.
- AI leverage: `Observed core outcome multiplier`, `Meaningful recurring use`, `Incidental`, `Marketing-only/none`, `Unresolved`.
- Differentiation: `Rare and credibly proved`, `Distinctive combination`, `Common baseline`, `Undifferentiated`, `Unresolved`.
- Autonomy: `High control`, `Shared control`, `Constrained`, `Incompatible`, `Unresolved`.
- Fulfillment: `Repeated strong evidence`, `Promising`, `Mixed`, `Harmful`, `Unresolved`.
- Downside risk: `Bounded`, `Material but manageable`, `Concentrated`, `Unacceptable`, `Unresolved`, with loss mechanism and worst credible case.
- Reversibility: `Days`, `Weeks`, `Months`, `Costly/long lock-in`, `Unresolved`.
- Option value: `Expands multiple branches`, `Expands one branch`, `Neutral`, `Closes paths`, `Unresolved`.
- Evidence quality: `High`, `Moderate`, `Low`, `Unresolved`. `N/A` means not applicable and never means zero.

Income reports time to first paid validation separately from replacement eligibility.

### Horizon weights

Gates always come first. Within a branch and horizon, apply `Primary` criteria before `Secondary`. `Context` explains but cannot silently overturn a Primary criterion.

| Branch | 30 days | 90 days | 12 months |
|---|---|---|---|
| Strongest employment | Primary: speed, demonstrated ability, learning cost, downside, reversibility. Secondary: differentiation, AI leverage, option value. Compensation is a gate. | Primary: speed, compensation, demonstrated ability, differentiation. Secondary: AI leverage, learning cost, downside, reversibility, option value. | Primary: compensation, fulfillment, AI leverage, differentiation, option value. Secondary: autonomy, demonstrated ability, downside, reversibility, learning cost. Speed is context. |
| Collaborative or independent income | Primary: paid-validation speed, demonstrated ability, learning cost, downside, reversibility. Secondary: differentiation, AI leverage, option value. Compensation is a trajectory. | Primary: repeat demand, compensation trajectory, differentiation, downside, reversibility. Secondary: demonstrated ability, AI leverage, autonomy, option value. | Primary: risk-adjusted compensation, demand durability, autonomy, fulfillment, downside, option value. Secondary: AI leverage, differentiation, demonstrated ability, reversibility, learning cost. |
| Durable fulfillment | Primary: observed pull, useful-product progress, constructive collaboration, learning cost, reversibility. Secondary: autonomy, AI leverage, option value. | Primary: fulfillment persistence, sustainable energy, demonstrated behavior, downside. Secondary: autonomy, collaboration, AI leverage, differentiation, option value. | Primary: fulfillment, useful-product impact, constructive peers, autonomy, sustainable downside, option value. Secondary: compensation sustainability, AI leverage, differentiation, demonstrated ability, reversibility. |

### Dominance, tradeoffs, ranges, and synergy

Within one branch and horizon, an option dominates only when it is no worse on every comparable Primary criterion, clearly better on at least one, and uncertainty cannot reverse the result. Otherwise return a named nondominated tradeoff set. For each option show gain, sacrifice, assumption, downside, reversibility, option value, and confidence.

Keep estimated value separate from confidence. Low confidence widens the plausible ordinal range and permits evidence collection or reversible experiments only. `Unresolved` blocks dependent commitments. Show evidence-bounded base, credible downside, and credible upside without invented probabilities.

Name a synergy only when one completed action creates a reusable artifact, skill proof, relationship, or decision input for another branch. Credit its time and cost once. Name shared dependency risk. Thematic similarity alone is not synergy.

### Switching triggers

- Day 30 employment: require at least three active qualified interview processes, including one beyond initial screening. If absent, revise positioning, target mix within the two role views, channels, and proof artifacts without lowering hard gates.
- Day 90 employment: if no qualifying offer exists, hold a user checkpoint using conversion evidence and counter-evidence. Broaden tactics or eligible role framing only.
- Qualifying offer: use employment as stable base, reweight learning toward onboarding and production AI proof, and keep income experiments bounded and fulfillment visible.
- Learning load: apply the settled increase and rollback rule.
- Income proof: Stage 1 may advance after paid demand. Only the three-month diversified proof gate starts replacement review.
- Evidence degradation: Low permits collection or reversible experiment only. Unresolved blocks dependent commitment.
- Fulfillment harm: track useful-product progress, constructive collaboration, and sustainable energy or timezone weekly. Persistent hard harm, or fewer than two indicators for four consecutive weeks, fires the gate. Pause experiments immediately. Employment needs mitigation and a user checkpoint, not impulsive exit.

Every trigger states an immediate bounded action, evidence to collect, and a user checkpoint. Safety and hard-gate breaches may pause automatically. Major time reallocation, employment replacement, or branch switching requires explicit confirmation.

## Required final analysis

Write a self-contained Markdown analysis with this exact main-body order:

1. Title, analysis date, evidence cutoff, revision, and interview confirmation date.
2. How to read the analysis.
3. Decision control panel.
4. Evidence coverage and unresolved gaps.
5. Governing constraints, budget, and capacity.
6. Demonstrated strengths and positioning foundations.
7. Role view: Senior Product IC.
8. Role view: AI Product Builder.
9. AI expectations and credible specialization adjacencies across both role views.
10. Ranked learning bets by role view and strategy branch.
11. Project portfolio decisions.
12. Positioning narratives and plain-language concepts.
13. Branch plan: Strongest employment.
14. Branch plan: Collaborative or independent income.
15. Branch plan: Durable fulfillment.
16. Cross-branch sequencing, dependencies, synergies, and option value.
17. Decision checkpoints, switching triggers, and blocked conclusions.
18. Risks, counter-evidence, confidence, and plausible ranges.
19. Immediate authorized actions only.
20. Appendices A through H.
21. Human-readable and machine-readable quality results.

### Decision control panel

Lead with:

- interview confirmation state;
- compensation, remote, timezone, management-first, privacy, and capacity gates;
- evidence coverage and demand-denominator readiness;
- three independent branch cards in fixed order. Every card names branch, purpose, applicable gate states, current stance, 30-day focus, 90-day checkpoint, 12-month direction, support, counter-evidence, confidence, plausible ordinal range, and next trigger;
- two independent role-view cards. Every card names role view, current evidence profile, near-term stance, main gap or uncertainty, and links to its complete view;
- branch gate states include compensation, remote and timezone, management-first rejection, privacy, and chronic fulfillment harm wherever each gate applies. Use `N/A` only when a gate truly does not apply.

Never show a combined score or winner.

### Evidence coverage

Show required, inspected, unavailable, unsafe, stale, excluded, quarantined, and unassessed surfaces. Use counts only with real denominators. Include raw job views, unique requisitions, unique employers, duplicates, quarantines, unresolved identities, full project metadata inventory, deep-review count, unassessed count, material market claims, properly corroborated claims, and blocked claims.

Keep an unresolved-register excerpt in the main body. Each item names its forbidden assumption.

### Constraints, strengths, demand, and gaps

Show:

- hard-gate tests and violation results;
- weekly and monthly capacity ledger, including job-search commitments and shared-action accounting;
- demonstrated strength matrix with evidence state, recency, depth, proof diversity, role-view use, limits, and confidence;
- proof-story cards with attributable behavior and verified or unresolved outcomes;
- a complete demand universe summary, demand matrix, candidate gap matrix, and ordinal role profile separately for each role view;
- AI duty table that keeps tool use, product integration, model or data, evaluation and safety, operations, and domain-only evidence separate;
- external adoption, task exposure, productivity, displacement, and ecosystem activity as separate constructs.

### Learning bets and AI specialization

Publish six learning rankings. Each row includes rank band, capability, action type, branch-specific reason, demand or value basis, evidence gap, observable proof, hours, cost, dependencies, support, counter-evidence, confidence, sensitivity stability, and decision link.

Rank only assessed weak or missing evidence. Low confidence permits collection or experiment only. Unresolved evidence blocks a rank.

For every credible AI specialization adjacency, include:

- plain-language definition;
- explicit employer duties and addressable evidence;
- fit and gap analysis for each role view;
- relevance to each strategy branch;
- attributable personal support and limits;
- learning and proof path within budget and capacity;
- counter-evidence, confidence, falsifier, and next checkpoint.

Do not preordain a specialization and do not produce one overall AI winner.

### Complete project inventory and decisions

Appendix E must inventory every accessible local and authenticated GitHub project after deduplication, including unassessed projects. The main body shows every material project decision.

Allowed decisions are `Consolidate`, `Publish`, `Reframe`, `Continue`, `Archive`, or `Hold`. For each, state branch and role-view purpose, evidence preserved, work required, hours, cost, dependency, risk, counter-evidence, confidence, recheck point, and what must not be exposed. Private projects use opaque IDs only.

### Positioning and explanations

Provide one canonical narrative for each role view with a short introduction, proof map, limit, counter-narrative, evidence-backed response, and interview bridge. Appendices must include recruiter, hiring-manager, and technical-peer variants plus full proof maps. Narratives may change emphasis but never facts, metrics, role history, or evidence state.

Explain an unfamiliar concept at first use in no more than three plain-language sentences and link to Appendix H. Do not explain familiar terms to inflate length.

Candidate-facing narrative, positioning, project descriptions, and action text must be revised using `skill://humanizer`. Preserve precise evidence and uncertainty while removing promotional language, vague attribution, formulaic phrasing, and generic AI prose. The final analysis must contain no em dash or en dash characters. Rewrite those sentences rather than replacing the characters mechanically.

### Branch-first plans

Render three independent plans. Each plan contains 30-day, 90-day, and 12-month horizons. Do not produce one roadmap with branch tags.

Every horizon shows:

- observable branch outcome;
- Primary and Secondary criteria;
- eligible options and gate states;
- criterion profiles;
- support and counter-evidence;
- confidence and plausible ordinal range;
- dominance or nondominated tradeoff set;
- sequenced actions with observable completion;
- hours, costs, and dependencies;
- synergies and one-time capacity charge;
- risks and falsifiers;
- user checkpoint and switching trigger;
- option value and action stance.

Strongest employment keeps Senior Product IC first and AI Product Builder close second. Collaborative or independent income keeps Stage 1 reversible and Stage 2 gated. Durable fulfillment tracks useful products, constructive collaboration, autonomy, sustainable energy, and intrinsic pull.

### Risks, blocked conclusions, and immediate actions

Each material recommendation has one canonical card with branch, role view, horizon, stance, bounded action, Fact, User value, Inference step, support, counter-evidence, constraints checked, confidence, base and credible downside and upside, falsifier, dependencies, synergies, hours, cost, checkpoint, trigger, and blockers.

Keep blocked conclusions in the main body. Name why blocked, forbidden assumption, affected actions, exact evidence needed, owner, confidence effect, and next update point.

End the main body with only currently authorized actions. Exclude blocked, deferred, and later-horizon work. Do not end with a recap or overall recommendation.

### Appendices

- Appendix A: full personal, market, interview, project, and application evidence-card registry.
- Appendix B: source manifests, coverage, inaccessible surfaces, privacy exclusions, duplicate families, stale context, and exclusion log.
- Appendix C: demand method, posting identities, raw minimum quotes, transformations, universes, weights, denominators, sensitivity, concentration, and detailed matrices.
- Appendix D: complete candidate capability evidence, strength and gap cards, recency, depth, proof diversity, conflicts, full proof maps, and recruiter, hiring-manager, and technical-peer positioning variants.
- Appendix E: complete deduplicated project inventory, deep-review rationale, private redaction log, and project action rationale.
- Appendix F: confirmed interview record, ask log, answers, superseded statements, contradictions, confidence changes, deferrals, and unresolved items.
- Appendix G: gate states, ordinal branch profiles, horizon weights, dominance checks, tradeoff sets, plausible ranges, shared-action ledger, and dependencies.
- Appendix H: concept glossary and primary sources for unfamiliar concepts.

Main-body evidence IDs link to appendix anchors. Every evidence card links back to each dependent claim or recommendation. A card with no dependent claim is either removed or clearly retained as counter-evidence or coverage evidence.

## Read-only review and repair loop

After the controller writes a complete noncanonical draft, run independent read-only reviews. Use disjoint reviewers for:

1. source provenance, authority, confidence, freshness, evidence families, and bidirectional links;
2. privacy, secrets, unsafe paths, private identifiers, and unrelated personal material;
3. both role views, all three branches, all three horizons, gates, scenario rules, and no-winner requirement;
4. constraints, time, budget, shared actions, dependency costs, switching triggers, and authorized actions;
5. generic advice, repeated material prose, fake precision, unsupported claims, candidate-facing humanization, and forbidden dash characters;
6. scope-ledger completeness, every required main-body section, Appendices A through H, and quality report.

Reviewers do not edit files or recommend career branches. They return exact findings with severity, location, violated rule, evidence, and repair condition.

The controller repairs every blocking finding, reruns all hard checks, then reruns each affected review. Continue until all hard checks pass. A failing draft stays in `/tmp`. If a hard blocker cannot be resolved, emit an exact noncanonical blocking report and do not create the canonical file.

## Hard quality gate

Any item below blocks canonical delivery:

- missing required source status, section, branch, role view, horizon, appendix, manifest, deliverable, or quality result;
- material Fact, Inference, User value, or recommendation without correct bidirectional evidence links;
- recommendation without personal evidence, market evidence, counter-evidence, constraints, branch, role view, horizon, observable completion, hours, cost, confidence, falsifier, and checkpoint;
- generic advice that would fit an unrelated senior engineer;
- fabricated achievement, metric, preference, market claim, causal claim, or certainty;
- hidden branch or role collapse, overall winner, combined denominator, or single roadmap with branch tags;
- unsupported probability, exact forecast, decimal fit or priority decision, trend from one snapshot, or weighted share without numerator, denominator, employer count, requisition count, and scope;
- broken or missing anchor, unsafe private link, claim without a card, or card without a dependent claim or declared coverage purpose;
- duplicated recommendation reasoning, repeated material prose, shared action counted more than once, or dependent sources counted as independent;
- violated hard constraint, unresolved gate used as Pass, more than approved weekly capacity or monthly budget, or omitted dependency cost;
- privacy leak, credential-like string, private repository detail, raw log or database content, private contact, unrelated personal material, or public identity-search result;
- deferred or blocked item converted into an assumption;
- placeholder, TODO, empty mandatory table, malformed material label, or missing quality report;
- em dash or en dash character in the final analysis;
- candidate-facing text that still fails the humanizer review.

The generic-advice check fails a recommendation when it could fit an unrelated senior engineer, lacks personal and market evidence, omits branch, role view, horizon, constraint, or observable outcome, ignores meaningful counter-evidence, or exceeds the evidence.

The hidden-collapse check fails on any overall branch score or winner, combined role-view denominator, learning list without branch and role keys, one roadmap with branch tags, fulfillment used only as an income tie-breaker, income assumed to replace employment, or weak evidence in one branch used to erase another.

The fake-precision check fails on unsupported probabilities, exact time-to-offer outside ordinal bands, decimal fit or priority decisions, denominator-free percentages, one-snapshot trends, causal claims from application outcomes or posting removals, and capacity totals that omit dependencies or shared-action accounting.

## Quality report

End the analysis with human-readable results and this machine-readable structure:

```yaml
quality_report:
  status: pass | blocked
  checks:
    - id:
      result: pass | fail
      evidence:
      failures: []
  generic_recommendations_found: []
  unsupported_claims_found: []
  repeated_content_found: []
  branch_collapse_found: []
  fake_precision_found: []
  constraint_violations_found: []
  privacy_violations_found: []
  forbidden_dash_characters_found: []
  blocked_delivery_reasons: []
```

## Completion proof and delivery

Create the canonical file only after every hard check passes.

Then reopen the exact canonical path and verify:

- file is nonempty;
- path is the selected unused path;
- analysis date, UTC-3 basis, frozen cutoff, and revision match the run;
- interview record has an explicit confirmation date;
- every required heading appears exactly once;
- both role views, all three branches, and all three horizons are present;
- Appendices A through H are present;
- internal anchors resolve bidirectionally;
- no placeholder or TODO remains;
- no em dash or en dash character exists;
- `quality_report.status` is `pass`;
- no portfolio, project, application, tracker, source-of-truth, or unrelated Choice Ledger file changed.

The delivery response must report only:

- exact canonical path;
- frozen evidence cutoff;
- interview confirmation date;
- quality status;
- blocked-conclusion count;
- inaccessible or failed source count and concise list;
- confirmation that no recommendation was executed.

Stop discovery only when the scope ledger is exhaustive and every ID is assigned or statused. Stop the interview only under its stop rules and after explicit record confirmation. Stop synthesis only when each required section is complete or its dependent conclusion is explicitly blocked. Deliver only after reopening the canonical file proves the hard-check pass. Otherwise continue repairs, ask one admitted user-owned blocker, or stop with an exact noncanonical blocking report. Never silently shrink scope.
