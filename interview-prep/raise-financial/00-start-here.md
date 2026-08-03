# Raise Financial Interview Preparation

**Interview:** 30 minutes with Patrick Cason, CTO

**Primary objective:** Earn the next step by showing honest technical depth, founding-engineer judgment, and a clear learning plan for Expo and Alpaca.

## Start here

If you have two hours, follow `06-two-hour-prep-plan.md`.

If you have less than an hour, use its 45-minute minimum plan.

Keep `05-call-plan.md` open during the call. Do not keep every document open.

## The six things to remember

1. This is not a full rewrite. Patrick described a focused mobile build for the Investment product, covering roughly 30 percent of the current product surface, with substantial backend behavior expected to carry over.
2. Raise Investment is not a savings account, loan, or ordinary brokerage account. Use the product's own terms in `CONTEXT.md`.
3. Your strongest evidence is shipped React Native feature work, nearly nine years with React and TypeScript, systems built from scratch, and team delivery practices.
4. Your boundaries are clear: no Expo, no Alpaca, no native build or store ownership, and no direct ownership of brokerage or compliance control systems.
5. Your delivery stance is to protect the date by cutting product surface while preserving financial invariants, reconciliation, recovery, and auditability.
6. Patrick already accepted the Alpaca gap. Show how you learn and how you manage risk. Do not apologize repeatedly.

## Recommended reading order

| Order | File | Use |
|---|---|---|
| 1 | `01-product-and-company.md` | Product mechanics, customer lifecycle, company facts, product questions |
| 2 | `CONTEXT.md` | Canonical product terms and words to avoid |
| 3 | `02-stack-and-delivery.md` | Proposed system, integration risks, Expo and Alpaca primers |
| 4 | `03-patrick-sdlc-and-signals.md` | Patrick's public context, G2i workflow, team and process questions |
| 5 | `04-positioning-and-stories.md` | Introduction, honest gap answers, proof stories |
| 6 | `05-call-plan.md` | Four primary questions, backups, opening, closing, listening signals |
| 7 | `07-rehearsal.md` | Likely questions, scenarios, and self-review rubric |

## Your concise fit statement

> I bring deep React and TypeScript experience, shipped React Native feature work across three Kraken apps, and a pattern of building the systems teams need to deliver. Expo and Alpaca are new to me, and my recent work is frontend led. I am comfortable naming those boundaries, learning through the real product and provider contracts, and taking ownership in reviewable slices without weakening financial correctness.

## The four questions to prioritize

1. What exactly counts as the two-month launch, and which customer journey is non-negotiable?
2. What did the year-long paid pilot change, especially around manual onboarding, exits, and the future operations platform?
3. Which systems are authoritative for membership, principal, Market Value, Take-Home Value, and transfers, and where does the team reconcile by hand?
4. What must be true by days 15, 30, and 60, and how will the two founding engineers divide ownership?

The exact wording and rationale are in `05-call-plan.md`.

## The main product insight

The new app is not only a cross-platform interface. It has to help a Member understand an unusual economic relationship:

1. The Membership Fee is Raise revenue and is not invested.
2. Institutional capital supplies the Advanced Principal.
3. The Member sees a Position with both Market Value and Take-Home Value.
4. A Buffered ETF exchanges some upside for a targeted downside buffer during a specific Outcome Window.
5. The Member can Exit, but a mid-window Exit may behave differently from the headline cap and buffer.
6. The current public flow includes human onboarding and a chat-based Exit, which raises an important product question about what the app automates and what remains operational.

That clarity problem is directly relevant to your strengths in explicit state, data-heavy financial interfaces, accessibility, and cross-platform product behavior.

## The main technical insight

The stack list is less important than the boundaries between systems. The discussion should center on:

1. Shared product logic versus platform-specific auth, secure storage, navigation, provider SDK, accessibility, and release behavior.
2. Existing backend behavior versus education-product coupling.
3. Raise-owned membership and entitlement state versus provider-owned execution, payment, and transfer state.
4. Webhook replay, idempotency, out-of-order events, reconciliation, and operational recovery.
5. Product analytics and logs versus a durable financial event and audit history.
6. App store privacy, account deletion, reviewer access, and legal-entity requirements as launch work, not final-week paperwork.

## Hard guardrails

1. Do not call the buffered structure a guarantee or insurance policy.
2. Do not use Market Value and Take-Home Value interchangeably.
3. Do not imply that the Member owns the Advanced Principal.
4. Do not claim native build, app store, Expo, Alpaca, brokerage, ledger, or compliance expertise.
5. Do not assume the public FAQ fully describes the legal, custodial, or technical structure.
6. Do not present a detailed architecture before learning the existing system.
7. Do not recommend a rewrite merely because the new client is greenfield.

## After the call

Record the answers using the checklist at the end of `06-two-hour-prep-plan.md`. Remind Patrick about the OpenAI project engineer introductions after the interview, as he requested.
