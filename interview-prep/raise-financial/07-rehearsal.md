# Rehearsal Guide

## How to use this

Practice aloud. Keep most answers between 45 and 90 seconds. Do not memorize complete paragraphs. Memorize the claim, one proof point, the boundary, and the lesson.

The likely questions below are **[INFERENCE]** based on Patrick's Slack message, the job description, and the agreed call objective.

## Core questions

### 1. Tell me about yourself and why this role

**Your answer must cover:**

1. Nearly nine years with React and TypeScript.
2. React Native delivery across three Kraken apps.
3. Foundational systems and team process built from scratch.
4. The personal reason the financial access problem matters to you.
5. Why a focused mobile launch and close founding-team work appeal to you.

**Avoid:** A chronological walk through every job.

### 2. What exactly did you do in React Native?

**Lead with:** The shipped support portal across three established apps.

**Be precise about:** Screens, components, state, API consumption, tests, and rollout.

**State the boundary:** You did not own native modules, build infrastructure, store submission, or greenfield app architecture.

**Bridge:** Cross-platform product behavior, platform-specific constraints, design system reuse, and rollout discipline transfer directly.

### 3. You have not used Expo. How will you ramp up?

**Answer shape:**

1. Start from the real critical flows, not a broad tutorial.
2. Build a narrow spike across iOS, Android, and web.
3. Test routing, auth persistence, secure storage, provider SDK support, forms, deep links, accessibility, and deployment.
4. Record which modules are truly shared and where adapters are necessary.
5. Turn the findings into a risk-ranked launch plan.

Do not promise mastery after a weekend.

### 4. You have not used Alpaca. Why should I trust you with it?

**Answer shape:**

1. Patrick already knows the gap, so do not sound defensive.
2. Connect your Kraken experience to explicit financial states and customer trust, not to brokerage expertise.
3. Describe the learning sequence: account model, funding and transfer states, events, idempotency, reconciliation, sandbox limits, and operational recovery.
4. Pair with product and capital markets owners to validate domain rules.
5. Take ownership in a small vertical slice with review before expanding scope.

### 5. Can you own backend work?

**Answer shape:**

1. Your recent work is frontend led.
2. Your evidence is five Node.js microservices, REST contracts, Docker, and CI/CD redesign.
3. You can reason about contracts, failure states, and production delivery.
4. You would seek targeted review for brokerage controls and schema decisions until you have demonstrated depth in this system.

This answer should create confidence without recasting your history.

### 6. How would you deliver in under two months?

**Your stance:** Protect the date by reducing surface area. Do not reduce financial correctness.

**Sequence:**

1. Define the critical customer journey and launch invariants.
2. Inventory the existing backend behavior that supports it.
3. Prove the riskiest integration and cross-platform assumptions first.
4. Cut education-product code and secondary customer flows from scope.
5. Deliver thin vertical slices to a test environment.
6. Use short human-reviewed AI implementation phases.
7. Run manual end-to-end checks with provider sandbox events and failure scenarios.
8. Keep a visible deferred-scope list.

### 7. How would you reuse the current backend?

**Answer shape:**

1. Map investment-product behavior and external contracts.
2. Add characterization coverage around critical paths.
3. Separate proven shared behavior from education-only coupling.
4. Reuse in slices while preserving observability and rollback.
5. Avoid redesign unless evidence shows the old model cannot support the focused product.

### 8. What does responsible AI-assisted engineering mean to you?

**Answer shape:**

1. The human owns problem framing, constraints, and acceptance criteria.
2. AI can help draft plans, challenge assumptions, implement bounded phases, and review changes.
3. Every phase gets human review against the plan and the actual codebase.
4. Verification exercises the changed behavior, not merely generated tests.
5. The PR states decisions, risks, evidence, and what remains outside scope.

**Proof point:** Your testing and delivery infrastructure work shows that speed and review can reinforce each other.

### 9. Tell me about a time you built with minimal structure

Use the Norsk Gjenvinning story. Focus on creating just enough process for five engineers across two time zones, then shipping five storefronts. Explain that cadence, review, and CI/CD were tools for reducing ambiguity rather than bureaucracy.

### 10. Tell me about a difficult technical tradeoff

Use either:

1. The microservices refactor, if Patrick wants backend depth.
2. The React Native portal, if he wants cross-platform product judgment.
3. The VRT work, if he wants speed versus quality.

Always include what you would do differently or what constraint made the decision correct in that context.

### 11. What would you do in your first week?

**Answer shape:**

1. Learn the product lifecycle with Patrick, Jack, and Brian.
2. Run the existing investment product and inspect support and operational pain.
3. Map critical domain terms, states, providers, and source-of-truth boundaries.
4. Trace one customer journey through the current frontend, backend, database, and provider events.
5. Validate Expo assumptions with one thin cross-platform slice.
6. Agree on launch scope, invariants, ownership, and the first reviewable delivery milestone.

### 12. Why move from Kraken to a seven-person company?

> At Kraken, I learned how financial products benefit from explicit states, careful rollout, and consistent experiences across platforms. What I want next is more direct ownership of the product and the engineering system around it. Raise is small enough that I would work directly with the CTO, product, design, and capital markets, and focused enough that the team can ship a complete customer journey rather than one isolated part of a large platform.

Only use this if it is true. Do not criticize Kraken or imply that company size makes careful engineering unnecessary.

## Scenario drills

### A provider sends the same event twice

Say that external events must be treated as repeatable. Persist a provider event identifier or a stable idempotency key, make state transitions conditional on the current state, and retain enough evidence to explain what happened. Then ask which system is authoritative for that event and how current operations reconcile mismatches.

### The mobile app shows a different balance than the provider

Do not guess which number wins. Identify each balance concept, its source, and its freshness. Protect the customer from acting on ambiguous data, log the mismatch, and route it to a reconciliation path. Ask whether Raise maintains its own ledger, a derived entitlement view, or only provider-backed projections.

### App store review threatens the launch date

Protect the date through early submission planning, a narrow native surface, feature flags where appropriate, and a web fallback only if the product and compliance model permit it. Do not promise that web export removes app review risk.

### The existing backend has no tests around a critical calculation

Capture current behavior with representative and edge-case examples before moving it. Validate the examples with the domain owner. Reuse only after the team can distinguish intended rules from accidental behavior.

### Product wants identical screens on all platforms

Share domain rules, data access, validation, analytics semantics, and reusable visual primitives where practical. Keep navigation, secure storage, permissions, input behavior, accessibility details, and provider SDK boundaries platform aware.

## Questions you should be ready to answer briefly

1. What is the hardest part of this role for you?
2. How do you ask for help without losing momentum?
3. How do you review AI-generated code?
4. When do you choose a shared abstraction versus duplication?
5. How do you keep a two-person engineering team aligned?
6. How do you handle a disagreement with a CTO?
7. What does good manual QA look like for a financial flow?
8. How do you know an MVP is small enough?
9. What work would you refuse to delegate to AI?
10. What would make you cut a feature one week before launch?

## Self-review rubric

After one rehearsal, score each area from 1 to 3.

| Area | 1 | 2 | 3 |
|---|---|---|---|
| Concision | Rambling or over two minutes | Mostly clear | Direct and under 90 seconds |
| Evidence | General claims | One relevant example | Specific action, result, and boundary |
| Honesty | Hides gaps or apologizes | Names gaps | Names gaps and shows a credible learning path |
| Product judgment | Talks only about code | Mentions users or scope | Connects user value, risk, scope, and operations |
| Founding fit | Waits for instructions | Shows ownership | Creates clarity and brings recommendations |
| Technical judgment | Names tools | Discusses architecture | Identifies invariants, failure modes, and source-of-truth boundaries |

Record only the answers that score 1. Rehearse those once more. Do not spend time polishing answers that are already clear.
