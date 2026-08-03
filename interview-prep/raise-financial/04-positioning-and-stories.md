# Positioning and Story Bank

## The position to take

You are not the exact checklist candidate. You are a strong founding engineer candidate with a clear specialty and honest gaps.

Your strongest case is:

1. Nearly nine years with React and TypeScript.
2. A React Native feature shipped across three established Kraken apps.
3. Experience building foundational systems from scratch, including delivery process, CI/CD, testing infrastructure, design tokens, experimentation, and shared components.
4. Experience working inside a financial product where clarity, explicit state, accessibility, and customer trust matter.
5. A working style that matches Patrick's preference for planned, reviewed, human-owned AI assistance.
6. Evidence that you can learn unfamiliar domains and turn ambiguity into a practical delivery system.

Your boundaries are equally important:

1. Your React Native work was at the feature layer. You did not own native builds, store delivery, or app infrastructure.
2. You have not used Expo.
3. You have not integrated Alpaca.
4. Your recent work is frontend led. Your earlier backend experience includes Node.js services and APIs, but you are not currently a backend specialist.
5. You worked inside a regulated fintech, but did not own brokerage, compliance, ledger, custody, or money movement controls.

Patrick already knows about the Alpaca gap and has said willingness to learn is enough. Do not turn an accepted gap into an apology.

## 60 second introduction

> I have spent nearly nine years working with React and TypeScript across web and mobile. At Kraken, I shipped an in-app support portal across three React Native apps. I also built design system and testing infrastructure used across multiple platforms. Before that, I led a five-person engineering team, introduced delivery and CI/CD practices, shipped five Next.js storefronts, and built Oda's first experimentation program.
>
> What interests me about Raise is the mix of a consumer financial product, a focused cross-platform build, and the opportunity to help shape how a small engineering team works. My strongest areas are React, TypeScript, frontend architecture, and delivery systems. My React Native experience is at the feature layer, and Expo and Alpaca are both new to me. I want to be clear about those boundaries. What I can bring straight away is product judgment, a habit of making risky states explicit, and an AI-assisted workflow where I remain responsible for every decision and outcome.

Do not memorize this word for word. Memorize the sequence: experience, relevant proof, why Raise, honest boundary, immediate value.

## Why Raise

> I care about this problem because access to good financial guidance is uneven. My father worked in a traditional bank, so I grew up with someone who could help me understand long-term financial decisions. Even with that support, it was not simple. Raise is trying to give younger customers a clearer path to long-term market exposure. The engineering side also appeals to me: a deliberately narrow mobile product, a small team, direct access to product and capital markets, and the chance to build the delivery foundation instead of inheriting it.

Keep the personal connection brief. Move quickly from motivation to the actual work.

## Technical gap answer pattern

Use four parts:

1. **Evidence:** Say what you have shipped.
2. **Boundary:** Say exactly where that experience ends.
3. **Transfer:** Explain which mental models carry over.
4. **First action:** Describe how you would close the gap using the real system and official docs.

### If asked about React Native and Expo

> At Kraken, I shipped the support portal feature across three established React Native apps. I owned the feature layer: screens, components, state, API consumption, tests, and rollout. I did not own the native build infrastructure or store releases, and I have not used Expo yet. What carries over is my experience with cross-platform React architecture, along with knowing that web, iOS, and Android do not always behave the same way. I would start by running the product's critical flows through a small Expo spike, identifying the platform boundaries early, and using what I learn to shape the app architecture. I would not assume every screen can be shared unchanged.

### If asked about Alpaca

> I have not integrated Alpaca. The relevant experience I do have is building customer-facing financial data surfaces at Kraken, where I had to work carefully with explicit states, permissions, backend contracts, and rollout risk. I would start by understanding Alpaca's account model, funding and transfer states, webhook delivery, sandbox behavior, idempotency, and reconciliation. Then I would map those concepts to Raise's existing backend behavior with someone who owns the product and capital markets rules. I would rather be clear about the gap and how I plan to close it than bluff about brokerage integration experience.

### If asked about backend ownership

> My recent role has been frontend led. Earlier in my career, I built Node.js microservices and REST APIs, including a refactor into five independent services that cut runtime by 120 times and resource use by 10 times. I am comfortable working across the boundary and reasoning about contracts, failure states, and delivery, but I would not describe myself as a current specialist in brokerage backends or database design. At Raise, I would first characterize the existing critical behavior before changing it. From there, I would take ownership in slices, with clear review around financial controls.

## The four stories to prepare

### 1. React Native support portal

**Use for:** mobile delivery, customer focus, cross-platform judgment, ambiguity.

**Situation:** Support access was fragmented across three Kraken apps.

**Task:** Build one in-app support experience that respected customer tier and live service conditions.

**Action:** Built the feature across three established React Native apps with tier-aware contact choices, VIP manager details, and live queue visibility. Worked at the feature layer across shared product behavior and platform-specific constraints.

**Result:** Shipped the portal to all three apps.

**Reflection:** Shared information architecture and behavior matter more than forcing every platform to render an identical screen.

**Do not claim:** Native module work, build pipeline ownership, store submission, or greenfield app architecture.

### 2. Five storefronts and a new delivery process

**Use for:** founding ownership, team process, direct stakeholder work, shipping under ambiguity.

**Situation:** Norsk Gjenvinning needed to modernize and expand a family of storefronts while a five-person team worked across two time zones.

**Task:** Improve delivery consistency and ship the products.

**Action:** Built the sprint cadence, review process, and CI/CD setup. Worked with the CEO, product, design, business, and engineers. Shipped five React, TypeScript, and Next.js storefronts and created a shared component library.

**Result:** The library served three teams and reduced feature cycle time by roughly 25 percent.

**Reflection:** A shared system creates leverage only when teams can adopt it easily. Process should remove uncertainty, not add ceremony.

### 3. Visual regression infrastructure

**Use for:** fast delivery without lowering quality, AI workflow, engineering leverage.

**Situation:** Visual checks took 12 minutes and coverage was limited.

**Task:** Make the feedback loop fast enough to use during normal development.

**Action:** Built the Playwright visual regression infrastructure and changed how tests were executed.

**Result:** Runtime fell below one minute and component coverage tripled.

**Reflection:** Quality controls protect speed only when they are cheap enough to run continuously.

### 4. Microservices and CI/CD refactor

**Use for:** backend credibility, system boundaries, observability, operational ownership.

**Situation:** Sportradar crawlers were coupled, slow, and resource intensive. Deployment was unreliable.

**Task:** Separate responsibilities and improve the delivery path.

**Action:** Refactored the workload into five Node.js microservices, designed REST communication, containerized services, and moved CI/CD from Jenkins to GitLab.

**Result:** Runtime improved by 120 times, resource use fell by 10 times, and deploy failures fell by 85 percent.

**Reflection:** Service boundaries are useful only if operations and ownership improve with them.

## Founding engineer judgment

If the two-month date conflicts with scope, your position is:

> I would protect the date by cutting product surface, not by weakening financial correctness. I would make the critical user journey and its invariants explicit, prove the riskiest integrations early, and keep a visible list of what will not ship. Identity, authorization, contribution state, entitlement calculations, provider reconciliation, idempotency, auditability, and recovery paths are not polish. Secondary flows and broad platform parity are negotiable.

If asked about reusing the backend:

> I would not treat 80 to 90 percent reuse as either a mandate to copy blindly or an excuse for a rewrite. I would first map the behavior the investment product depends on, put characterization coverage around critical contracts, identify education-only coupling, and then move proven behavior in small slices. The goal is to preserve known business behavior while reducing the product surface.

## What to mention naturally

1. Patrick's clarification changed your view from a full rewrite to a focused mobile launch for the investment product.
2. You understand that a native presence is partly about trust and legitimacy, not only technical capability.
3. Your cross-platform view is shared product behavior with deliberate platform boundaries.
4. You have already worked with the exact human review loop he described for AI-assisted development.
5. You build tooling when it shortens the team's feedback loop, not as an architecture hobby.
6. You are comfortable working directly with product, design, business, and leadership.
7. You will remind Patrick after the interview about introductions to the OpenAI project engineers, as he requested.

## What not to say

1. Do not describe the product as a savings account, brokerage account, loan, or retirement account unless Raise uses that exact term for a specific legal structure.
2. Do not promise that one codebase will make iOS, Android, and web equally cheap.
3. Do not imply that React Native experience automatically covers Expo, native build systems, or app stores.
4. Do not call yourself an Alpaca or regulated backend expert.
5. Do not propose a broad rewrite before understanding the existing backend and product invariants.
6. Do not lead with a long architecture pitch. Ask about constraints first.
7. Do not spend the opening apologizing for gaps Patrick has already accepted.
