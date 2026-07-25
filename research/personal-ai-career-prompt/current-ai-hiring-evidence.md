# Current AI and Hiring Evidence

**Research date:** 2026-07-25  
**Scope:** Evidence requirements for assessing AI-related demand and adjacent opportunities in remote UTC-3 senior Frontend, Design Systems, Growth, Full Stack, and Developer Experience work. This is an evaluation method, not a personalized career recommendation.

## Answer

The final prompt should not ask whether “AI is growing” or whether a role is “AI-proof.” It should test a narrower chain:

1. Is there current, addressable employer demand for the role or task cluster?
2. Is that demand available across the candidate's geography, contract model, and UTC overlap?
3. Is AI actually being adopted in relevant firms and workflows, rather than merely discussed?
4. Which tasks are exposed, augmented, automated, or newly valuable?
5. Do observed engineering outcomes support the claimed effect?
6. Does the signal persist across time, owners, and methods?

No source answers all six. A material conclusion should normally require at least two independent owners **and** two method classes. Official statistics supply base rates; direct employer postings establish addressable demand; task data define the work; product telemetry shows behavior; experiments test causality; surveys explain perceptions but do not prove outcomes.

## Source hierarchy

Use sources in this order. Lower levels may qualify higher levels, not overrule them alone.

1. **Official statistics and representative surveys:** labor levels, projections, wages, business AI adoption, and occupational/task definitions. Prefer disclosed samples, denominators, revisions, and downloadable data from [BLS](https://www.bls.gov/emp/), [U.S. Census](https://www.census.gov/data/experimental-data-products/business-trends-and-outlook-survey.html), [Eurostat](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table?lang=en), [ILO](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure), and [O*NET](https://www.onetcenter.org/db_releases.html).
2. **Direct administrative and behavioral evidence:** unique employer requisitions, application behavior, product usage, repository activity, or delivery outcomes. Examples: employer-published [Greenhouse](https://developers.greenhouse.io/job-board.html), [Lever](https://hire.lever.co/developer/documentation#postings-api), and [Ashby](https://developers.ashbyhq.com/reference) postings; [Indeed Hiring Lab](https://www.hiringlab.org/remote-work/); [LinkedIn Economic Graph](https://economicgraph.linkedin.com/research/remote-work-gap); and [GitHub Innovation Graph](https://innovationgraph.github.com/).
3. **Causal or quasi-experimental studies:** strongest for a bounded productivity claim, but only for the studied population, tasks, tools, and time. The 2025 METR RCT involved 16 experienced open-source developers and 246 tasks using early-2025 tools; it cannot stand for every developer or later model generation ([paper](https://arxiv.org/abs/2507.09089)).
4. **Transparent voluntary surveys:** useful for role, experience, and sentiment slices; weak for population prevalence and causality. Retain the owner's sampling limits, as in the [2025 Stack Overflow methodology](https://survey.stackoverflow.co/2025/methodology/) and [2025 DORA report](https://dora.dev/research/2025/dora-report/).
5. **Vendor claims, forecasts, announcements, funding, social attention, stars, and raw download totals:** discovery inputs only until corroborated above.

## Required source register

| Evidence question | Primary/first-party source and owner | Update pattern | What it can establish | Important limits |
|---|---|---|---|---|
| Structural occupation demand | U.S. Bureau of Labor Statistics [Employment Projections](https://www.bls.gov/emp/) and [OEWS](https://www.bls.gov/oes/) | Annual releases; projections cover a ten-year horizon | U.S. occupation employment, projected openings/growth, and wage/employment baselines | U.S.-only; broad SOC groups; not remote, cross-border, or exact-title demand; projections are not current vacancies |
| Tasks, skills, work activities, technology | U.S. Department of Labor-sponsored [O*NET database releases](https://www.onetcenter.org/db_releases.html) | Periodic versioned releases | A reproducible task/skill vocabulary and occupational crosswalk | U.S. taxonomy; descriptions are not vacancy counts or AI outcomes |
| Current role-specific demand | Employer-published ATS data via [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html), [Lever postings](https://hire.lever.co/developer/documentation#postings-api), and [Ashby reference](https://developers.ashbyhq.com/reference) | Live; record retrieval, publication, and update timestamps | Explicit duties, seniority, skills, compensation when posted, location, and employer hiring intent | Published requisitions are not hires; stale/reposted/duplicated jobs and ATS selection require cleanup |
| Remote-work posting trend | Indeed Hiring Lab–OECD [remote-work project](https://www.hiringlab.org/remote-work/) and [data portal](https://data.hiringlab.org/) | Portal series update on owner schedule | Posting-based remote/hybrid trends across countries and occupations | Indeed platform coverage and text classification; aggregate categories; a remote label does not imply worldwide eligibility |
| Remote supply-demand gap | LinkedIn Economic Graph [The Remote Work Gap](https://economicgraph.linkedin.com/research/remote-work-gap) | Published research snapshot; check observation window before reuse | Remote posting share versus applicant behavior across covered countries | LinkedIn members/jobs only; applications are interest, not qualified supply or hires; no guaranteed cadence |
| Working-from-home prevalence | WFH Research [Global Survey of Working Arrangements](https://wfhresearch.com/global-survey-of-working-arrangements-g-swa/) and [research/data page](https://wfhresearch.com/research-and-policy/) | Periodic waves and downloadable releases | Comparable employee-reported WFH patterns across many countries, including global context | College-educated full-time workers; survey/nonresponse limits; employment arrangements, not open vacancies |
| U.S. business AI adoption | U.S. Census Bureau [Business Trends and Outlook Survey](https://www.census.gov/data/experimental-data-products/business-trends-and-outlook-survey.html) | High-frequency experimental survey releases | Reported business use and expectations by sector/size where available | U.S. nonfarm businesses; experimental estimates and question wording; firm use does not identify an engineering role |
| EU business AI adoption | Eurostat [AI by enterprise size/class dataset](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table?lang=en) and [ICT-enterprise metadata](https://ec.europa.eu/eurostat/cache/metadata/en/isoc_e_esms.htm) | Annual ICT usage survey | Cross-country enterprise adoption by size and industry | Generally enterprises with 10+ persons; EU scope; self-reported adoption, not productivity or hiring |
| Global task exposure | ILO–NASK [Generative AI and Jobs: A Refined Global Index of Occupational Exposure](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) | Versioned research release; 2025 source at research date | Task-based technical exposure across occupations and countries | Exposure is neither adoption nor displacement; occupation aggregation hides workflow and employer choices |
| Observed AI task use and early labor outcomes | Anthropic [Economic Index](https://www.anthropic.com/economic-index) and 2026 [labor-market impacts method](https://www.anthropic.com/research/labor-market-impacts) | Periodic releases; capture traffic and labor-data windows | Claude usage by task and an explicit bridge from theoretical capability to observed exposure; the 2026 report also tests U.S. CPS outcomes | One vendor's traffic and taxonomy; selected users; U.S. labor-outcome bridge; observational results are not proof of causality or the whole AI market |
| Engineering delivery and organizational practice | Google Cloud/DORA [2025 State of AI-assisted Software Development](https://dora.dev/research/2025/dora-report/) | Annual research program | Reported AI use alongside delivery, team, and organizational conditions | Cross-sectional self-report and associations; participating technologists are not a labor-market sample |
| Developer adoption and perceptions | Stack Overflow [2025 Developer Survey](https://survey.stackoverflow.co/2025/) with [methodology](https://survey.stackoverflow.co/2025/methodology/) and [AI results](https://survey.stackoverflow.co/2025/ai/) | Annual completed survey | Global role/experience slices, tool use, trust, and friction | Voluntary convenience sample recruited through owner channels; perceptions do not equal measured productivity |
| Causal developer productivity | METR [early-2025 AI RCT](https://arxiv.org/abs/2507.09089) | Study-specific, not a recurring index | Causal completion-time effect for experienced maintainers doing real tasks in familiar repositories | Small, narrow population; early-2025 Cursor/Claude tool vintage; no universal productivity estimate |
| Software ecosystem behavior | GitHub [Innovation Graph](https://innovationgraph.github.com/) and [Octoverse 2024](https://github.blog/news-insights/octoverse/octoverse-2024/) | Innovation Graph quarterly; Octoverse annual when published | Repository, contributor, language, topic, and geography activity on GitHub | Platform activity is not paid demand; repositories/contributions can reflect learning, bots, forks, or experimentation; owner has product incentives |
| Package/tool attention | npm's [download-count definition](https://github.com/npm/registry/blob/master/docs/download-counts.md) and PyPI's [download-analysis guide](https://packaging.python.org/en/latest/guides/analyzing-pypi-package-downloads/) | Event/count data; query a declared window | Directional package consumption and ecosystem change | Downloads are not unique users, production adoption, revenue, vacancies, or skill demand; CI, mirrors, caching, and automation distort counts |

## Role and opportunity taxonomy

BLS and O*NET categories are structural anchors, not sufficient role filters. The prompt should build a versioned dictionary containing title variants, tasks, skills, and exclusions, then publish the dictionary with results ([BLS projections](https://www.bls.gov/emp/); [O*NET](https://www.onetcenter.org/database.html)). At minimum:

| Lane | Include title/task language |
|---|---|
| Frontend | Frontend/front-end, web, UI, product engineer; browser architecture, accessibility, performance, JavaScript/TypeScript, component delivery |
| Design Systems | Design systems, UI platform, component library, design technologist, accessibility; tokens, documentation, governance, designer-developer workflow |
| Growth | Growth, product-growth, experimentation, lifecycle; A/B testing, analytics/instrumentation, acquisition, activation, retention, conversion |
| Full Stack | Full-stack, product/software engineer; web client plus APIs, data, cloud/runtime, ownership across delivery |
| Developer Experience | Developer experience/productivity, developer platform, tooling, enablement, SDK, CLI, docs engineering; CI/CD, build systems, observability, internal platforms |

Do not treat exact-title frequency as the market. A “Product Engineer” may be full stack or growth; “Platform Engineer” may mean infrastructure rather than DevEx; design-system work may appear inside frontend roles. Resolve ambiguous postings from task text, and report both strict-title and task-expanded counts.

## Addressable-vacancy protocol

1. **Freeze scope before counting.** Record as-of date, seniority, employment/contract types, and explicit eligible geography: Brazil, Latin America, Americas, worldwide, or another stated country list. Record required UTC hours. “Remote” alone is not cross-border eligibility ([Indeed remote-work data](https://www.hiringlab.org/remote-work/); [LinkedIn remote gap](https://economicgraph.linkedin.com/research/remote-work-gap)).
2. **Collect employer-owned postings.** Sample multiple employer sectors and at least the Greenhouse, Lever, and Ashby public surfaces; preserve canonical URL, requisition ID, employer, title, published/updated date, location text, salary, seniority, role-lane matches, AI duties, and skills ([Greenhouse](https://developers.greenhouse.io/job-board.html); [Lever](https://hire.lever.co/developer/documentation#postings-api); [Ashby](https://developers.ashbyhq.com/reference)).
3. **Deduplicate.** Canonicalize employer plus requisition ID; otherwise use employer, normalized title, location, and description fingerprint. Mark mirrored, stale, and reposted listings. Report postings **and unique employers** so one hiring campaign cannot masquerade as a market.
4. **Code eligibility separately from relevance.** Use `explicitly eligible`, `explicitly ineligible`, or `unclear`; never promote unclear to eligible. Separately code lane, seniority, compensation disclosure, UTC compatibility, employment model, and whether AI is a product domain, a required tool, a task, or marketing language.
5. **Measure persistence.** A live snapshot proves availability, not direction. Prefer repeated snapshots at least 30 days apart and a 90-day window; corroborate direction against the current Indeed series. Preserve removals instead of assuming they became hires ([Indeed data portal](https://data.hiringlab.org/)).
6. **Publish denominators and uncertainty.** Show total collected, unique requisitions, unique employers, eligible/unclear/ineligible, source shares, missing dates, and classification disagreements. Quote representative posting language with its direct employer URL.

## Trend categories the final prompt should require

- **Demand:** addressable unique requisitions, unique employers, openings trend, seniority, compensation disclosure, and role/task mix—not generic “software jobs.” Ground structural context in [BLS](https://www.bls.gov/emp/) and current demand in employer postings.
- **Remote access and competition:** geographic eligibility, contract/payroll constraints, UTC overlap, remote posting share, and applicant pressure. Keep availability ([Indeed](https://www.hiringlab.org/remote-work/)), employee arrangements ([G-SWA](https://wfhresearch.com/global-survey-of-working-arrangements-g-swa/)), and applicant behavior ([LinkedIn](https://economicgraph.linkedin.com/research/remote-work-gap)) separate.
- **Enterprise adoption:** actual use by firm size/sector, not executive intent or spend alone. Compare at least two official populations such as [Census BTOS](https://www.census.gov/data/experimental-data-products/business-trends-and-outlook-survey.html) and [Eurostat](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table?lang=en).
- **Task transformation:** distinguish theoretical exposure, observed usage, augmentation, automation, and labor outcomes. Never convert an [ILO exposure score](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) or [Anthropic observed-exposure measure](https://www.anthropic.com/research/labor-market-impacts) directly into jobs lost.
- **Engineering outcomes:** separate developer perception, delivery association, and causal task performance. Triangulate [Stack Overflow](https://survey.stackoverflow.co/2025/ai/), [DORA](https://dora.dev/research/2025/dora-report/), and bounded experiments such as [METR](https://arxiv.org/abs/2507.09089); name tool/model vintage and experience level.
- **Ecosystem pull:** require alignment among job-description requirements, maintained repository activity, and package/tool use. Treat [GitHub](https://innovationgraph.github.com/), [npm](https://github.com/npm/registry/blob/master/docs/download-counts.md), or [PyPI](https://packaging.python.org/en/latest/guides/analyzing-pypi-package-downloads/) counts alone as attention, not hiring.
- **Adjacent opportunity:** identify recurring tasks that cross lanes—AI interface/product integration, evaluation and observability, accessible component systems, experimentation infrastructure, SDK/docs/tooling, workflow governance—and count them only when current employer postings corroborate the task cluster.
- **Counter-signals:** declining eligible postings, concentration in few employers, unclear geography, falling entry points, low production use, quality/rework costs, or causal results inconsistent with self-reported gains. Contradictory evidence must be shown, not averaged away.

## Freshness gates

Apply cadence-aware gates; do not use one universal cutoff.

| Source type | Freshness requirement |
|---|---|
| Live employer postings | Retrieve during the analysis; normally no older than 30 days. Preserve first/last-seen and repost status. |
| High-frequency posting or business series | Latest available point should normally be within 90 days; use a rolling window and record revisions. |
| Quarterly telemetry | Latest two available quarters; compare like definitions. |
| Annual statistics/surveys | Latest completed release plus the prior comparable release; record fieldwork and publication dates. |
| Structural projections/task taxonomies | Latest official vintage; keep its stated horizon and do not mislabel it as current vacancy data. |
| Experiments | Prefer recent tool generations, but always report study date, models, tools, population, tasks, sample, outcome, and confidence interval. A newer model does not silently invalidate or generalize an older result. |
| One-off reports | Use only with the observation window visible and a current corroborating source. |

If a source misses its gate, retain it only as historical context and label it stale. Never substitute publication date for observation period.

## Durable, weak, and hype rules

### Durable signal

Label a claim **durable** only when all apply:

- at least two independent owners and two method classes support the same construct;
- the effect persists across at least two comparable releases/quarters, or a structural baseline agrees with current addressable postings;
- geography, population, denominator, observation window, and role mapping are explicit;
- the signal survives deduplication and is not concentrated in one employer or vendor;
- task exposure is corroborated by adoption or usage, and any claimed labor effect by labor outcomes;
- no major contradictory source remains unexplained.

### Weak signal

Label **weak** when evidence is real but has one owner/method, a short window, narrow geography, small or voluntary sample, unclear denominator, non-addressable postings, platform-selection bias, or tool-vintage limits. Examples include a single survey movement, one vendor's usage mix, one small RCT generalized cautiously, a one-month vacancy spike, repository growth, or package downloads.

### Hype / reject as decision evidence

Label **hype** when a claim relies on an uncited forecast, press release, funding total, benchmark demo, vendor headline without method, social engagement, stars, raw downloads, duplicated job listings, a newly coined title, self-reported time saved, or a statement that exposure equals replacement. “AI will eliminate developers” and “AI makes developers X% faster” both fail unless population, task, comparator, model vintage, outcome, and independent corroboration are supplied ([ILO exposure limits](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure); [METR's bounded RCT](https://arxiv.org/abs/2507.09089)).

## Triangulation protocol for the final prompt

For every material conclusion:

1. **Define the construct.** Choose one: employment stock, vacancy flow, eligible remote vacancy, application pressure, enterprise adoption, task exposure, observed task use, productivity, delivery outcome, or ecosystem activity. Do not blend them.
2. **Create an evidence card.** Record claim, owner, direct URL, publication date, observation period, cadence, method class, population/sample, geography, role/task mapping, metric/denominator, comparison period, known bias, and retrieval date.
3. **Establish the base rate.** Use the latest BLS/O*NET or relevant official business/labor series. Mark its geographic mismatch instead of pretending it represents the global remote market.
4. **Test addressability.** Require deduplicated direct postings with explicit geography and UTC/contract eligibility. Aggregate platform trends cannot establish that a specific remote market is open.
5. **Test AI mechanism.** Pair technical exposure ([ILO](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure)) with actual adoption ([Census](https://www.census.gov/data/experimental-data-products/business-trends-and-outlook-survey.html) or [Eurostat](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table?lang=en)) and observed task use where relevant ([Anthropic](https://www.anthropic.com/research/labor-market-impacts)).
6. **Test outcome claims.** Pair survey evidence with behavioral/organizational telemetry and a causal study when claiming productivity or quality ([DORA](https://dora.dev/research/2025/dora-report/); [METR](https://arxiv.org/abs/2507.09089)).
7. **Check time alignment and independence.** Sources should observe roughly the same market/tool era. Two reports using the same underlying postings, survey panel, or vendor telemetry count as one evidence family.
8. **Resolve disagreement explicitly.** First test different constructs, samples, dates, geographies, and model vintages. If disagreement remains, lower confidence; do not average incompatible metrics.
9. **Assign `durable`, `weak`, or `hype`.** State which rule was met or failed. Give a falsifier and next update date for each durable or weak conclusion.
10. **Return an evidence ledger.** Present supporting and counter-evidence side by side, followed by the narrowest warranted conclusion. No material recommendation may appear without its evidence cards.

## Minimum output contract

The eventual prompt should return:

- an as-of date and freshness audit;
- the published role/task dictionary;
- an addressable-vacancy table with denominators, unique employers, and eligibility uncertainty;
- source cards for every material claim;
- separate tables for demand, remote access, AI adoption, task transformation, engineering outcomes, and ecosystem activity;
- a durable/weak/hype label with rule-based rationale;
- contradictions and source dependencies;
- geographic and role limitations;
- what new evidence would change each conclusion;
- direct primary/first-party URLs, never uncited trend prose.

This method deliberately leaves a conclusion unresolved when the evidence layers do not meet. Uncertainty is preferable to converting platform activity, task exposure, or AI marketing into a labor-market fact.
