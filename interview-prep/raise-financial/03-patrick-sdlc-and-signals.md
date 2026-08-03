# Patrick Cason, SDLC, and interview signals

**Purpose:** Prepare for a 30 minute CTO conversation, not provide a biography. Public facts and candidate-provided Slack context are separated below. All linked sources were accessed 2026-08-02.

## What is publicly verifiable about Patrick

- Raise Financial's official team page identifies Patrick Cason as CTO. His self-authored GitHub profile identifies him as co-founder and CTO of Raise, and says he leads engineering at G2i across AI infrastructure, reinforcement learning environments, human data systems, and internal tooling. [Raise team page](https://www.raisefinancial.com/about) and [Patrick's GitHub profile](https://github.com/cereallarceny) (accessed 2026-08-02).
- G2i's official leadership page lists Patrick as Head of Eng. Patrick's GitHub profile uses VP of Engineering. The difference may be a naming or update-timing issue, so use "engineering leader at G2i" unless Patrick states a preferred title. [G2i leadership](https://www.g2i.ai/our-company) and [Patrick's GitHub profile](https://github.com/cereallarceny) (accessed 2026-08-02).
- Patrick's public profile says he still prefers Next.js and TypeScript for application development and that his current work includes agent workflows, task harnesses, human data pipelines, and evaluation surfaces. This is relevant to the proposed Raise stack and to his interest in explicit AI delivery process. [Patrick's GitHub profile](https://github.com/cereallarceny) (accessed 2026-08-02).
- G2i publicly describes its operating model as engineer-led review, versioned rubrics with audit trails, and live calibration, agreement, and drift tracking. Its stated company bias is quality over volume. These are G2i claims, not proof that Raise uses the identical process. [G2i company page](https://www.g2i.ai/our-company) (accessed 2026-08-02).

**Interview-relevant overlap:** Patrick occupies leadership roles at both Raise and G2i, works publicly in TypeScript and AI engineering systems, and shared an official G2i repository that makes an artifact-driven delivery flow explicit. That supports discussing disciplined AI assistance in concrete SDLC terms. It does not establish that Patrick authored the repository or that Raise has adopted it unchanged.

## Raise leadership and hiring context

### Confirmed publicly

- Raise announced a $2 million equity seed round on 2026-07-29 after what it describes as a year-long paid pilot. The company reports no customer churn during that pilot and more than 1,600 historical waitlist signups. These performance figures are company-reported, not independently audited in the cited announcement. [Raise seed announcement](https://www.linkedin.com/pulse/raise-financial-closes-2-million-seed-round-jumpstart-wealth-3ovcf/) (accessed 2026-08-02).
- Raise says the funding will support a broader public release, operational infrastructure, team growth, partnerships, education, and customer acquisition. [Raise seed announcement](https://www.linkedin.com/pulse/raise-financial-closes-2-million-seed-round-jumpstart-wealth-3ovcf/) (accessed 2026-08-02).
- Raise publicly identifies Wesley Belden as founder and CEO, while its team page and Patrick's profile identify Patrick as CTO or co-founder and CTO. [Raise seed announcement](https://www.linkedin.com/pulse/raise-financial-closes-2-million-seed-round-jumpstart-wealth-3ovcf/), [Raise team page](https://www.raisefinancial.com/about), and [Patrick's GitHub profile](https://github.com/cereallarceny) (accessed 2026-08-02).

### Candidate-provided Slack context to confirm

Patrick told Fabricio that Raise has seven people, plans to add two founding engineers and one product designer reporting to him, and expects near-daily CTO contact, frequent huddles, and twice-weekly team syncs. He also described an under-two-month mobile delivery. These details are useful working context, but they were not located in a current first-party public engineering job post. Confirm decision rights, role split, working cadence, and whether the schedule starts before or after the team is staffed.

## The g2i-ai/agents SDLC vocabulary

The repository calls itself a reusable, stack-agnostic framework for structured and repeatable AI-assisted software delivery. Its canonical flow is:

`brief -> spec -> tdd -> code -> review -> draft-pr`

Each stage is expected to produce an artifact or observable result, while a workflow skill coordinates stages and records outputs, changed paths, blockers, and the next step. [Repository README](https://github.com/g2i-ai/agents/blob/main/README.md) and [workflow skill](https://github.com/g2i-ai/agents/blob/main/skills/workflow/SKILL.md) (accessed 2026-08-02).

| Stage | Concrete concept to recognize | Interview translation |
|---|---|---|
| Brief | Ground the request in the current codebase, then define the problem, user, P0/P1/P2 requirements, constraints, out of scope, metrics, dependencies, risks, milestones, and open questions. [Brief skill](https://github.com/g2i-ai/agents/blob/main/skills/brief/SKILL.md) and [brief template](https://github.com/g2i-ai/agents/blob/main/templates/product-brief-template.md) (accessed 2026-08-02). | "Before implementation, I want the non-negotiable user and financial behavior, the date-driven scope, and explicit exclusions." |
| Spec | Discover existing modules, data boundaries, APIs, auth posture, tests, and cross-cutting concerns before choosing architecture. Record ownership boundaries, security, performance, integration, rollout, and assertion-level testing plans with code citations. [Spec skill](https://github.com/g2i-ai/agents/blob/main/skills/spec/SKILL.md) and [spec template](https://github.com/g2i-ai/agents/blob/main/templates/tech-spec-template.md) (accessed 2026-08-02). | "I would characterize backend contracts and critical invariants before accepting the 80 to 90 percent reuse assumption." |
| TDD | For suitable behavior changes, capture expected and actual behavior, write a focused failing test, observe red, implement the smallest fix, observe green, then refactor and run applicable checks. [TDD skill](https://github.com/g2i-ai/agents/blob/main/skills/tdd/SKILL.md) (accessed 2026-08-02). | "Tests protect observable contracts and risky boundaries, not merely implementation details." |
| Code | Follow existing patterns, choose deliberately between test-first and direct implementation, make the smallest coherent change, and run checks appropriate to the change. [Code skill](https://github.com/g2i-ai/agents/blob/main/skills/code/SKILL.md) (accessed 2026-08-02). | "Small coherent slices make review and rollback easier without fragmenting ownership." |
| Review | Use a distinct QA responsibility to inspect correctness, regressions, missing verification, risky auth or data handling, dead code, and partial cutovers. Record PASS, PASS WITH RECOMMENDATIONS, or BLOCK, plus required actions. [Review skill](https://github.com/g2i-ai/agents/blob/main/skills/review/SKILL.md) and [QA report template](https://github.com/g2i-ai/agents/blob/main/templates/qa-report-template.md) (accessed 2026-08-02). | "AI can accelerate production, but a named human remains accountable for merge readiness and financial risk." |
| Draft PR | Run full verification before the first commit or PR, prepare a clean branch, use a conventional commit, generate the PR description, and open a draft PR before review. [Draft PR skill](https://github.com/g2i-ai/agents/blob/main/skills/draft-pr/SKILL.md) and [workflow PR validation](https://github.com/g2i-ai/agents/blob/main/skills/workflow/SKILL.md#pr-validation-before-draft-pr) (accessed 2026-08-02). | "Targeted checks support iteration, then a full gate protects the integration point." |

Two deeper ideas are worth recognizing:

1. **Artifacts carry context between stages.** Briefs, specs, tests, QA reports, and draft PRs make assumptions reviewable instead of leaving them inside a prompt or chat. [Repository README](https://github.com/g2i-ai/agents/blob/main/README.md) (accessed 2026-08-02).
2. **Explicit team vocabulary improves agent performance.** G2i reports that skill documents improved pass rates across its 20-task, 1,820-run evaluation, especially when the skill supplied an enumerated failure vocabulary and an action schema. Treat this as G2i's published benchmark result, not a universal guarantee. [G2i Skills Augmentation study](https://www.g2i.ai/research/ai-skills-augmentation) (accessed 2026-08-02).

The repository had six searchable commits, all dated 2026-04-20, when accessed. [Commit history](https://github.com/g2i-ai/agents/commits/main/) (accessed 2026-08-02). **[INFERENCE]** It is best treated as a concise public reference framework, not evidence of a mature Raise-specific operating system.

## Public workflow versus Patrick's Slack description

| Patrick's Slack description | Public artifact alignment | What remains open |
|---|---|---|
| Human planning before AI implementation | Strong alignment with brief and spec before code. | How lightweight are these artifacts for a sub-two-month launch? Who approves each one? |
| Phased implementation | The workflow supports a stage range or resuming from existing artifacts. Code asks for the smallest coherent change. | Does "phased" mean vertical product slices, technical layers, separate PRs, feature flags, or staged releases? |
| Human review and PR review | Review defines an accountable QA gate and explicit merge decision. Draft PR makes work visible before merge. | Who is the reviewer when Patrick is unavailable? Is approval required for every PR? |
| Manual QA | Review requires relevant checks and a QA report, but the public skill does not prescribe a specific manual test protocol. | Which device, account, money-movement, failure, and recovery scenarios require manual evidence? Who signs off? |
| Staged merges | Small coherent changes and draft PRs are compatible with staged merges. | The public repository does not define merge sequencing, stacked PRs, release branches, or rollback policy. |
| No unreviewed "vibe coding" | Strong alignment with artifacts, observed tests, verification, independent review, and a merge gate. | Which AI uses must be disclosed in a PR? What code or data may not be placed in third-party tools? |
| Frequent CTO collaboration | Not covered by the public repository. | What decisions need synchronous huddles, and what should remain async in artifacts? |

**How to sound fluent without mimicry:** Use the concepts naturally, then anchor them in Fabricio's evidence. For example: "On the Kraken React Native work, I owned the feature slice across screens, state, APIs, tests, and rollout. For Raise, I would start by making backend contracts and financial invariants explicit, split the mobile scope into reviewable vertical slices, and use AI inside that plan rather than as a substitute for it."

## Signals to carry into the call

### Positive signals

- Patrick contacted Fabricio directly and has already accepted the lack of Alpaca experience if Fabricio is willing to learn. This lowers the risk of a hidden keyword screen, while still leaving the learning bar to prove. Source: candidate-provided conversation.
- Public G2i materials and the shared repository consistently emphasize expert review, explicit rubrics, artifacts, testing, and auditability rather than unchecked generation. [G2i company page](https://www.g2i.ai/our-company), [repository README](https://github.com/g2i-ai/agents/blob/main/README.md), and [G2i Skills Augmentation study](https://www.g2i.ai/research/ai-skills-augmentation) (accessed 2026-08-02).
- Raise reports a paid pilot before broad launch, fresh equity funding, and planned investment in operational infrastructure and team growth. [Raise seed announcement](https://www.linkedin.com/pulse/raise-financial-closes-2-million-seed-round-jumpstart-wealth-3ovcf/) (accessed 2026-08-02).
- The proposed React Native and TypeScript work maps directly to Fabricio's shipped mobile feature experience, while the role offers a larger ownership surface. Source: candidate-provided role and candidate facts.

### Diligence signals

- An under-two-month delivery, simultaneous hiring, a new cross-platform client, and multiple brokerage and payment integrations create schedule and integration concentration risk. The 80 to 90 percent backend reuse figure is a hypothesis until contracts, test coverage, and current behavior are mapped. Source: candidate-provided Slack description.
- Patrick publicly holds significant engineering responsibilities at G2i while serving as Raise CTO. Ask about available Raise time, review coverage, and decision latency. Do not frame this as a criticism. [G2i leadership](https://www.g2i.ai/our-company) and [Patrick's GitHub profile](https://github.com/cereallarceny) (accessed 2026-08-02).
- Raise's pilot, churn, and waitlist metrics are self-reported. Ask what pilot feedback changed the launch scope and what evidence defines readiness. [Raise seed announcement](https://www.linkedin.com/pulse/raise-financial-closes-2-million-seed-round-jumpstart-wealth-3ovcf/) (accessed 2026-08-02).
- The public G2i workflow does not itself answer Raise-specific security, compliance, manual QA, release, incident, or data-handling rules. Those controls need explicit owners and evidence.

### Neutral unknowns

- Exact responsibilities of the two planned founding engineers, the existing engineer, Patrick, product, and design.
- Whether the public G2i workflow is mandatory at Raise, inspiration only, or a starting point to customize.
- Current backend test coverage, API stability, data migration needs, and the evidence behind the reuse estimate.
- Ownership of Expo builds, app-store releases, web deployment, on-call, vendor incidents, and production support.
- Approval boundaries for brokerage actions, payments, customer communications, and changes to financial logic.
- The first two months' definition of success beyond "ship the mobile build."

## Compact 30 minute interaction strategy

### 0 to 3 minutes: align on the problem

Give a 30-second positioning statement: nearly nine years in React and TypeScript, shipped a cross-app React Native feature at Kraken, previous Node.js API work, and disciplined AI-assisted delivery. Then ask what outcome Patrick most wants from this call.

### 3 to 9 minutes: give one complete proof story

Use the Kraken React Native example. Cover scope, established-app constraints, state and API work, tests, rollout, and the precise boundary: no ownership of native build or release infrastructure. Keep the story about observable delivery, not framework trivia.

### 9 to 17 minutes: reason through the Raise delivery

Use the repository's vocabulary in your own words:

1. Define launch-critical user behavior and financial invariants.
2. Characterize existing backend contracts and test evidence before committing to reuse.
3. Slice the client vertically into reviewable flows.
4. Use AI for bounded implementation and research inside explicit acceptance criteria.
5. Require human PR review, manual evidence for critical flows, staged merges, and rollback visibility.

Do not claim Alpaca or Expo expertise. State the gap, connect adjacent API and React Native experience, and explain the learning path through official docs, a narrow integration spike, sandbox behavior, error modes, and review with the domain owner.

### 17 to 24 minutes: expose the actual job

Ask two questions about ownership and topology, then one about feedback loops. Listen for named owners, decision latency, realistic sequencing, and whether safety constraints are explicit.

### 24 to 28 minutes: test the first 60 days

Ask what must be true at days 15, 30, and 60, including what gets cut if backend reuse proves lower than expected. Offer a short synthesis of how your experience maps to those milestones.

### 28 to 30 minutes: close for the next step

Summarize the strongest fit, one known gap with its learning plan, and the highest-risk delivery assumption you would validate first. Ask what Patrick still needs to see to move Fabricio forward.

### What Patrick is likely evaluating

- **[INFERENCE]** Whether Fabricio can own a cross-functional product slice rather than only implement UI tickets.
- **[INFERENCE]** Whether his React Native experience is real and bounded honestly, especially around native builds and release operations.
- **[INFERENCE]** Whether he can protect a compressed date through scope control without weakening financial, data, or integration invariants.
- **[INFERENCE]** Whether AI assistance increases speed while preserving planning, reviewability, testing, and human accountability.
- **[INFERENCE]** Whether he communicates well under frequent CTO contact, surfaces uncertainty early, and turns ambiguity into explicit decisions.
- **[INFERENCE]** Whether he can learn Expo and Alpaca quickly without pretending adjacent experience is identical experience.

## Strong questions, in priority order

### Engineering ownership

1. "What does end-to-end ownership mean for a founding engineer here: product discovery, mobile client, backend contracts, vendor integrations, release, and production support?"
2. "Which user and financial invariants are non-negotiable if the delivery date tightens, and who has final approval on changes to them?"
3. "What evidence currently supports the 80 to 90 percent backend reuse estimate? If that proves optimistic, which scope moves first and which scope cannot move?"

### Team topology

4. "How do you expect the two founding engineers, the existing engineering capacity, and the product designer to divide ownership?"
5. "Given your leadership work at both Raise and G2i, what decisions stay with you, what will engineers decide independently, and who unblocks review when you are unavailable?"
6. "What is the hiring sequence relative to the delivery clock, and which milestones assume the full team is already in place?"

### Feedback loops

7. "Which parts of the shared G2i flow are non-negotiable at Raise, and which should the founding engineers simplify or adapt?"
8. "For a critical investment or payment flow, what evidence must accompany a PR: automated contracts, manual device runs, sandbox traces, screenshots, or an explicit QA signoff?"
9. "How will pilot feedback reach engineering, and what product or operational metric decides whether a slice is ready for broader release?"
10. "What are the expected PR size and review turnaround, and how do you want staged merges, feature exposure, and rollback handled?"

### First two months

11. "What must be demonstrably true by days 15, 30, and 60 for you to say the hire is working?"
12. "What is the first risky assumption you want this hire to retire, and what would good evidence look like?"
13. "At the end of the mobile push, what should the founding engineers own that currently depends on you?"

## Final guardrails

- Do not infer personality from job titles, GitHub prose, or the shared repository.
- Do not attribute authorship of `g2i-ai/agents` to Patrick. He shared it; the public commit history shown above attributes the initial public work to another contributor.
- Do not present G2i's published benchmark as proof that every skill document or AI workflow works.
- Do not mirror Patrick's wording for effect. Translate the concepts into Fabricio's own shipped evidence and concrete decisions.
