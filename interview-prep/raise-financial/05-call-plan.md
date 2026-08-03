# 30 Minute CTO Call Plan

## What success looks like

Patrick leaves the call believing four things:

1. You have shipped real React Native product work and describe its boundaries honestly.
2. You can turn the two-month target into a focused delivery plan without weakening financial correctness.
3. You already work in the planned, human-reviewed AI style he expects.
4. You will close Expo and Alpaca gaps quickly without pretending adjacent experience is identical.

Your goal is the next step. Do not try to solve the whole architecture in 30 minutes.

## Flexible call shape

Patrick may lead the conversation, so use this as a guide rather than an agenda you impose.

### Opening: 0 to 3 minutes

Give the short introduction from `04-positioning-and-stories.md`.

Then create space:

> I have a few questions about the pilot, what counts as launch, and how you see the two founding engineers dividing ownership. I am also happy to start wherever would be most useful for you.

### Evidence: 3 to 10 minutes

Use the React Native support portal as the primary story. Make the exact ownership boundary clear before Patrick has to discover it.

If he wants a second example, choose based on his concern:

1. **Founding and team process:** Five storefronts, five engineers, review and CI/CD from scratch.
2. **Speed with quality:** VRT from 12 minutes to under one minute while tripling coverage.
3. **Backend evidence:** Five Node.js services, 120 times faster, 10 times less resource use, 85 percent fewer deploy failures.

### Raise delivery: 10 to 18 minutes

Use a short sequence:

1. Confirm the critical customer journey and the actual launch definition.
2. Map existing backend behavior and the financial invariants it carries.
3. Prove Expo, Alpaca, payment, auth, and provider-event risks early.
4. Deliver reviewable vertical slices across app, API, and provider boundaries.
5. Cut secondary product surface before cutting correctness, recovery, or auditability.

Do not present this as a design for a codebase you have not seen. Present it as the order in which you would remove uncertainty.

### Your questions: 18 to 27 minutes

Ask no more than four. Listen closely and follow the useful branch instead of racing through the list.

### Close: 27 to 30 minutes

Use your own words:

> This sounds like a strong match for how I like to work. My immediate strengths are React, TypeScript, cross-platform feature delivery, and building the systems a small team needs to ship. Expo and Alpaca are real gaps, but they are visible gaps with a concrete learning path, and I am comfortable being accountable for closing them. Is there anything you still need to understand about my background before deciding on the next step?

If the response is positive, ask what the next stage will evaluate.

## Four primary questions

### 1. What exactly is the two-month launch?

> When you say under two months, what must be live for that date to count: iOS and Android store approval, web, a limited cohort, or broad public access? Which customer journey is non-negotiable, and what is already outside scope?

**Why this matters:** The schedule is not actionable until launch and scope have observable definitions.

### 2. What did the paid pilot change?

> The funding announcement mentions a year-long paid pilot, and the FAQ still describes manual steps such as a founder onboarding call and chat-based exit. What did the pilot teach you about the customer journey, and which manual steps should the new app preserve, automate, or hand to the later operations platform?

**Why this matters:** It connects public product research to the new app and shows that automation should follow real operating knowledge.

### 3. Where are the source-of-truth boundaries?

> Across the current backend, PlanetScale, Alpaca, Frame, and the capital operations process, which system is authoritative for membership state, advanced principal, market value, take-home value, and transfer status? Where does the team currently reconcile differences by hand?

**Why this matters:** It reveals the riskiest backend and operations work without prescribing a design.

### 4. What should the founding engineers own by day 60?

> What must be true at roughly days 15, 30, and 60 for you to call the hire successful? How do you imagine the two founding engineers dividing ownership, and what should they own independently by the end of the mobile push?

**Why this matters:** It turns the role title into observable expectations and clarifies the team shape.

## Backup questions

### Product and customer trust

1. The product uses both Market Value and Take-Home Value. Where did pilot customers misunderstand those concepts, and what should the app do to make the distinction clear without overwhelming them?
2. The FAQ describes a buffer, an upside cap, 12-month outcome windows, and different behavior for mid-window exits. Which scenarios generate the most customer questions or support work today?
3. How do Jack and Brian participate in decisions about customer language, product rules, and capital operations?
4. Which pilot metric matters most for the public launch beyond signup volume: funded activation, continued membership, comprehension, support demand, or another measure?

### Backend reuse and delivery

5. What evidence supports the estimate that 80 to 90 percent of the backend can be reused? Where is the current code most coupled to the education product?
6. If reuse proves lower than expected, which scope moves first and which financial behavior cannot move?
7. Which provider integration or operational exception worries you most today?
8. What release evidence do you expect for a critical investment or payment flow beyond unit tests?

### Cross-platform client

9. Where do you expect real product parity across iOS, Android, and web, and where are platform-specific experiences acceptable?
10. Has the team already validated the proposed Expo libraries for auth, secure storage, provider SDKs, deep links, and web export?
11. What is the intended web experience: a signed-in application, public indexable pages, or both?
12. Who will own Apple and Google store setup, privacy declarations, review accounts, and release operations?

### AI and team workflow

13. Which parts of the public G2i flow are non-negotiable at Raise, and which should the founding engineers simplify for this launch?
14. How small do you expect implementation phases and PRs to be, and what review turnaround should the engineers design around?
15. Which decisions need a huddle with you, and which should engineers make independently and record in the artifact or PR?
16. When you are unavailable, who can approve product, financial, and release decisions?

## Product mechanics question to ask carefully

Raise's public FAQ uses several descriptions of downside protection. Some sentences say the Buffered ETF protects against major declines or prevents the asset from falling below its initial purchase price. Other passages describe a targeted buffer that applies only within its limit and depends on holding through the full Outcome Window.

Do not accuse Patrick of a contradiction. Ask:

> I noticed the help center sometimes uses broad protection language and elsewhere gives the more precise defined-outcome explanation, including buffer limits and mid-window behavior. Is simplifying that explanation a known product challenge for the new app? Who owns the final customer language and disclosure review?

This is a high-value question if the conversation turns toward customer trust, product education, or compliance. It is not one of the first four unless Patrick invites a product-mechanics discussion.

## What to listen for

### Strong signals

1. A specific launch cohort, critical journey, and explicit exclusions.
2. Named owners for product rules, capital markets, provider relationships, review, and release.
3. Concrete pilot findings that changed scope or customer language.
4. A credible account of existing backend contracts, tests, and operational work.
5. A plan for two engineers to review and unblock each other.
6. Financial and provider failures treated as normal operating scenarios, not rare surprises.

### Questions to follow up on

1. Launch means every platform, every flow, and public access at once.
2. The schedule begins before the engineers and designer are hired, but scope does not change.
3. The 80 to 90 percent reuse estimate has no traced contracts or current owner.
4. Financial source-of-truth and reconciliation responsibility are unclear.
5. Patrick is the only reviewer and decision maker, with no fallback.
6. Manual QA has no named scenarios, accounts, environments, or signoff.
7. Cross-platform reuse is treated as automatic parity.
8. AI speed is measured by output volume rather than verified delivery.

Do not challenge every weak signal in the first call. Ask one clarifying follow-up and record the rest for later diligence.

## If compensation comes up

The agreed strategy is to discuss commercial terms only if Patrick raises them. If he does, clarify facts without negotiating the whole package:

1. Contract length and expected weekly commitment.
2. Rate and payment currency.
3. Whether equity is included during contract status.
4. The intended criteria and timing for full-time conversion.
5. Working-hour overlap and any Nashville travel expectation.

## Final reminders

1. Be warm. Patrick already created an informal tone and gave you unusually rich context.
2. Use the Portuguese connection naturally only if it fits the conversation.
3. Do not fill every silence with another proof point.
4. Let Patrick correct your model. The correction is valuable information.
5. Remind him after the interview about the introductions to engineers on the OpenAI project.
