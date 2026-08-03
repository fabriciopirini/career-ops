# Stack and delivery brief

## Read this first

This is a risk map for a two-month cross-platform fintech launch, not a claim about Raise's current architecture. The stack and the estimate that 80 to 90 percent of backend behavior is reusable come from Patrick's conversation with Fabricio and have not been independently verified.

**Operating stance:** protect identity, authorization, money, positions, and auditability first. Reduce screens and polish before weakening any financial invariant.

Labels:

- **Confirmed:** stated by Patrick or guaranteed by cited provider documentation.
- **[INFERENCE]:** a likely responsibility or prudent design deduction that must be checked against the existing system.
- **Open:** a decision or fact Patrick needs to clarify.

Every linked source was accessed on **2026-08-02**.

## Risk-ranked view

| Priority | Boundary | Why it can break the date or the money |
|---|---|---|
| P0 | Existing backend and provider ownership | The mobile client can be thin only if existing contracts, state machines, and source-of-truth rules are understood before modification. **Open:** which system owns customer identity, cash availability, transfer state, orders, positions, and disclosures? |
| P0 | Frame, Plaid, and Alpaca money movement | Frame models charges and payouts as transfers, while Alpaca Broker also supports account funding. [INFERENCE] Without an explicit rail and ledger boundary, the same user action could create conflicting or duplicated cash state. [S12] [S16] [S19] |
| P0 | Asynchronous events, retries, and reconciliation | Alpaca uses replayable SSE streams for account, transfer, journal, and trade state. Frame retries failed webhooks only up to three times. A successful HTTP response is not a final financial outcome. [S14] [S17] [S18] |
| P0 | Idempotency | Frame V1 explicitly has no general `Idempotency-Key`; an ambiguous timeout followed by a blind retry can create two transfers. Provider event deliveries can repeat. [S17] |
| P0 | Authentication and secrets | Expo SecureStore has no web equivalent. OAuth redirect schemes require development builds, and provider secrets belong on the server. Native and browser sessions therefore need one authorization model but different credential storage and redirect handling. [S3] [S4] |
| P1 | Expo web versus native | Expo web output may be SPA, static HTML, or server output. Static export does not include an API server and unknown dynamic routes need special handling. Platform modules and browser behavior are not automatically portable. [S1] [S2] |
| P1 | PlanetScale and Prisma integrity | PlanetScale does not use foreign keys by default, though they can be enabled. Prisma relation emulation needs explicit indexes. PlanetScale deploy requests, not a conventional Prisma migration history, are the documented production path. [S10] |
| P1 | PII in logs and analytics | Axiom can ingest Vercel request and function logs. PostHog React Native autocapture can include identifiers and text unless constrained. Neither system should become a shadow KYC record or financial audit ledger. [S22] [S23] |
| P1 | Store review and legal identity | Apple has special expectations for regulated financial services, privacy, reviewer access, and account deletion. Google Play requires financial feature declarations, privacy and Data safety accuracy, reviewer access, and account deletion. Submission readiness can outlive engineering readiness. [S28] [S29] [S30] [S31] |
| P2 | Provider sandboxes | Sandboxes prove request shape and selected transitions, not production timing, bank behavior, review, settlement, or every failure. Alpaca documents at least one sandbox behavior that differs from live corporate-action processing. [S15] [S32] [S33] |

## Responsibility map and ownership questions

| Technology | Likely responsibility | What is supported by first-party material | Ownership to clarify |
|---|---|---|---|
| React Native and TypeScript | [INFERENCE] Shared client flow, view models, validation presentation, and API contract types across iOS, Android, and web | Expo positions React Native for Web as the universal primitive layer, while allowing web-only DOM code where needed. [S1] | Is this a new app or a client over existing API contracts? Which current web behavior is intentionally excluded? |
| Expo and Expo Router | [INFERENCE] App configuration, routing, native build integration, deep links, over-the-air update policy, and web output | Expo Router supports platform-specific modules. Native dependencies and config changes require development builds rather than Expo Go. [S1] [S5] | Who owns EAS, certificates, bundle IDs, signing, runtime versions, release channels, and rollback? |
| Expo web export | [INFERENCE] Browser client, not the Next.js backend | Expo supports `single`, `static`, and `server` web output. Static output has no API routes. [S2] | Which output is proposed? Is web deployed separately from the Next.js API? What URL and cookie boundary already exist? |
| React Native Reusables | [INFERENCE] Copy-in UI source and primitives, not a hosted service | The project describes shadcn/ui-inspired, NativeWind or Uniwind components and a CLI that copies component source into an Expo app. It does not promise fintech compliance, store approval, or complete native and web parity. [S7] | Which components have already been proven for keyboard, focus, accessibility, reduced motion, portals, and screen readers on all three targets? |
| Next.js API | [INFERENCE] Existing backend-for-frontend and provider orchestration surface | Next.js Route Handlers expose standard Request and Response handlers and are not cached by default for mutating methods. [S8] | Does Raise use App Router, Pages Router, server actions, jobs, or another service? Where do long-lived Alpaca streams and reconciliation jobs run? |
| Vercel | [INFERENCE] Next.js hosting, function execution, deployments, and log drain | Vercel functions have configured maximum durations and are terminated when they exceed them. [S9] | Can the current plan safely host long-lived SSE consumers and scheduled reconciliation, or are those already elsewhere? Do not assume a request handler is a durable worker. |
| PlanetScale MySQL | [INFERENCE] Operational application records, provider ID mapping, idempotency records, event checkpoints, and reconciliation evidence | Production branches use deploy requests. Foreign keys are off by default unless explicitly enabled. [S10] | Is PlanetScale the financial system of record, a projection of providers, or both? Are foreign keys enabled? What retention and backup recovery have been exercised? |
| Prisma | [INFERENCE] Schema, typed data access, local transactions, and uniqueness constraints | Prisma supports short transactions and warns against network calls inside transaction functions. It documents designing idempotent APIs and unique constraints. [S11] | Which invariants are enforced by the database versus application code? What version and `relationMode` are in use? |
| Alpaca Broker API | Broker account opening, KYC result state, funding or journals as configured, trading, activities, and operational reconciliation | Broker API covers account opening, funding, and trading. Account approval is asynchronous for trading-app and RIA setups; events are delivered over SSE. [S12] [S13] [S14] | What is Raise's exact Alpaca setup, enabled products, approval flow, source-of-truth policy, and production entitlement? Which Alpaca capabilities are already wrapped by the backend? |
| Frame Payments | Payment and payout capabilities if selected for a flow | Frame's canonical `Transfer` can represent charge, payout, or account-to-account movement. Payouts are asynchronous. [S16] | Is Frame used for subscription or fee payments, investment funding, bank account verification, or something else? Which balances can it mutate relative to Alpaca? |
| Plaid | [INFERENCE] User-consented bank linking and processor-token creation, not the authoritative cash ledger | Plaid Link has web and React Native SDKs. Frame's bank-account API accepts a processor token such as Plaid. [S19] [S20] | Does Plaid feed Frame, Alpaca, or both? Who owns Link token creation, Item health, relink flows, and webhook handling? |
| Axiom | [INFERENCE] Structured operational logs, traces, and alert investigation | Axiom can ingest Vercel request, function, and application logs. [S22] | What must never be logged? What correlation IDs, retention, access controls, datasets, and alerts already exist? |
| PostHog | [INFERENCE] Product analytics, feature rollout, and possibly session replay | Its React Native SDK supports Expo, web with a different storage dependency, autocapture controls, `before_send`, and optional native session replay. [S23] | Is replay enabled? What is the event allowlist? Who approves properties and identity linkage? |
| Twilio | [INFERENCE] SMS verification or user notification | Twilio signs inbound webhooks and supports outbound message status callbacks. [S24] [S25] | Is Twilio security-critical OTP, informational messaging, or both? Which delivery states affect product state, if any? |
| Resend | [INFERENCE] Transactional email | Resend documents signature verification and webhook replay or retry behavior. [S26] [S27] | Which messages are regulatory, security, or convenience communications? What is the fallback and delivery evidence requirement? |

## Load-bearing integration boundaries

### 1. Existing behavior before a new client

The claimed reuse ratio is plausible only if mobile uses current, stable backend semantics rather than reimplementing web behavior. In week one, identify:

- the existing endpoint for each retained journey;
- the authoritative state and allowed transitions;
- client-visible errors versus operational errors;
- provider identifiers and internal identifiers;
- retries, timeout recovery, and support interventions;
- disclosures, consent records, and communications triggered by each transition.

[INFERENCE] The safest two-month shape is a thin cross-platform client over characterized backend contracts. That is a discovery hypothesis, not a recommendation to preserve flawed behavior.

### 2. Expo web and native are one product contract, not one runtime

Share domain behavior and visual intent. Do not force identical implementations where the security or operating system boundary differs.

- `expo-secure-store` is native only. Browser credential handling needs a separate design. [S3] [S4]
- OAuth uses browser sessions and platform-specific return URLs. Expo Go cannot validate the production redirect path because custom schemes require a development build. [S3] [S5]
- A static web export has no server API, so it must call the existing Next.js API or another runtime. Unknown dynamic routes are not generated automatically. [S2]
- Native libraries, permissions, config plugins, and Info.plist or Android manifest changes require rebuilt binaries. [S5]

**Discovery gate:** prove login, logout, token expiry, forced revocation, deep-link return, cold start, background resume, and account switching on an iOS development build, Android development build, and deployed web origin before building broad UI.

### 3. Authentication and secure storage

Confirmed Expo guidance says authorization codes and provider secrets should be exchanged server-side, SecureStore is encrypted native storage, and no browser equivalent exists. [S3] [S4]

[INFERENCE] A credible contract is one server-side authorization policy with platform adapters:

- native adapter for redirect URI and minimal credential material in SecureStore;
- web adapter using an explicitly threat-modeled browser session, preferably server-controlled if the existing backend supports it;
- server enforcement for account ownership and authorization on every provider-facing operation;
- no provider secret, KYC payload, bank token, or authorization decision trusted to the client.

**Open:** current identity provider, session format, refresh and revocation rules, device trust, biometric policy, and whether account deletion already spans providers.

### 4. Alpaca account opening is a state machine

For a trading-app or RIA setup, account creation begins at `SUBMITTED`; Alpaca performs KYC asynchronously and can transition through `APPROVAL_PENDING`, `ACTION_REQUIRED`, `APPROVED`, and `ACTIVE`. Additional documents may be required. The exact flow differs for a fully disclosed broker-dealer. [S13]

Consequences:

- never present account submission as account activation;
- persist provider account ID and observed status separately from the user's current screen;
- model additional-information and document-retry journeys explicitly;
- consume and checkpoint account events, then compare with the account API after gaps or reconnects;
- treat event order, replay, reconnect, and status vocabulary as backend concerns, not mobile concerns.

Alpaca's SSE API supports replay from timestamp or monotonic ID, heartbeats, and reconnect guidance. Alpaca is migrating event identifiers toward ULIDs, which is a concrete compatibility question for the existing consumer. [S14]

### 5. Money movement, ambiguous outcomes, and idempotency

The unresolved architecture question is whether investment funding enters through Alpaca, Frame plus Plaid, or a defined composition. Frame supports asynchronous payouts, and Alpaca exposes transfer and journal events. [S14] [S16]

Minimum invariants to locate in existing code before changing it:

1. One durable internal operation ID per user intent.
2. One mapping from that intent to provider request and provider resource IDs.
3. A unique event ID record so duplicate delivery has no duplicate side effect.
4. No balance or status promoted from `pending` solely because an API call returned 2xx.
5. Terminal and reversal states retained, not overwritten as generic success or failure.
6. A recovery query for an ambiguous timeout before any retry.
7. Scheduled comparison of internal records with provider accounts, activities, transfers, orders, and positions.
8. Human-visible exception handling for mismatches rather than silent correction.

Items 1 through 8 are **[INFERENCE]** launch gates, not claims about the current backend.

Frame makes this urgent: V1 has no general idempotency header, recommends query-before-retry for transfers, and requires webhook deduplication by event ID. Its docs warn that retrying a timed-out transfer blindly can double-charge. [S17] Frame signs webhooks over the raw body with HMAC-SHA256, retries non-2xx or timed-out deliveries up to three times, and recommends backfill from resource APIs after an outage. [S18]

A database transaction cannot make a provider API call atomic with a database commit. Prisma explicitly advises keeping transactions short and avoiding network calls inside them. [S11] [INFERENCE] The discovery question is whether Raise already has a durable intent, event inbox or outbox, and reconciliation pattern. Reuse it if it preserves the invariants; change only the missing boundary.

### 6. PlanetScale and Prisma

Inspect, do not infer, the current configuration:

- whether PlanetScale foreign keys are enabled or Prisma uses `relationMode = "prisma"`;
- whether every emulated relation field has the needed explicit index;
- whether financial uniqueness constraints exist for internal operation ID and provider event or resource ID;
- how schema branches and deploy requests reach production;
- transaction isolation and retry behavior for concurrent state changes;
- backup, restore, and point-in-time recovery evidence.

PlanetScale's Prisma guide says production schema changes flow through development branches and deploy requests, recommends `prisma db push` rather than Prisma Migrate for this workflow, and warns that emulated relations need explicit indexes. [S10] [INFERENCE] Application-only relation emulation is not enough evidence for a financial invariant unless deletion, concurrency, and orphan recovery are deliberately covered.

### 7. Observability without creating another sensitive datastore

Axiom's Vercel integration can capture request, function, and `console` logs, including fields such as request path and IP in its documented shape. [S22] PostHog's React Native SDK can capture screen names and, when touch autocapture is enabled, identifiers and text content by default; it offers `ph-no-capture` and `before_send` filtering. [S23]

**Launch policy to confirm:**

- deny by default for raw KYC fields, government IDs, tax IDs, bank data, auth headers, cookies, tokens, full request bodies, and provider secrets;
- use synthetic internal correlation IDs rather than email or account number;
- keep product analytics separate from operational audit records;
- define production access, retention, erasure, environment separation, and alert ownership;
- test the emitted payloads from actual native and web builds, not just SDK configuration.

These controls are **[INFERENCE]**. The provider docs describe capture capabilities, not Raise's current policy.

### 8. App store review is part of the critical path

Apple asks for complete, functional review access and demo credentials, requires privacy disclosures and in-app account deletion when accounts can be created, and says apps in highly regulated fields such as financial services should be submitted by the legal entity providing the service. [S28] [S29]

Google Play requires accurate Data safety disclosures that include third-party SDK behavior, account deletion in app and through a web resource, reviewer access for restricted apps, and a Financial features declaration. Financial-services developers must use an Organization account. [S30] [S31]

[INFERENCE] In the first week, verify legal developer-account ownership, D-U-N-S and organization status where relevant, privacy policy, deletion path, reviewer account, support URL, SDK privacy inventory, screenshots, disclosures, and who answers review questions. Submit a thin but real build early enough to expose signing, entitlement, metadata, and policy failures.

### 9. Sandbox limits

- Alpaca sandbox provides immediate test access, but production enablement is a separate integration process. Its reconciliation guide says sandbox dividend processing does not reflect live operation. [S15] [S33]
- Frame provides test keys, cards, ACH account numbers, and selected failure scenarios. [S32]
- Plaid Sandbox provides deterministic test institutions and APIs to drive selected Item and webhook states. [S20] [S21]

[INFERENCE] Maintain a provider test matrix with happy path, asynchronous approval, action required, decline, timeout with unknown outcome, duplicate event, delayed event, reconnect and replay, reversal, relink, and outage recovery. Mark scenarios the sandbox cannot faithfully reproduce and rehearse them with controlled fixtures at Raise's boundary, not fake provider success in delivered product code.

## What to share and what to keep platform-specific

| Share across iOS, Android, and web | Keep platform-specific |
|---|---|
| API request and response schemas | Credential persistence: native SecureStore versus browser session |
| Domain vocabulary and explicit state machines | OAuth return URLs, universal links, app links, browser popup completion |
| Formatting and validation that does not claim server authority | Native permissions, biometrics, backup behavior, and secure-storage failure |
| Provider-neutral client commands such as submit application, create funding intent, and refresh status | Plaid or Frame SDK wrappers when their web and native SDKs differ |
| Loading, pending, action-required, declined, reversed, and retry-safe view states | App lifecycle, background resume, push handling, keyboard, safe areas, and hardware back |
| Design tokens and audited Reusables component source | Components that fail platform accessibility, focus, portal, or performance checks |
| Analytics event names and PII allowlist | SDK initialization, consent surfaces, and platform privacy declarations |
| Contract fixtures and invariant scenarios | Store metadata, signing, entitlements, privacy manifests, and release rollout |

**Rule of thumb:** share financial meaning and contract tests. Isolate operating-system capabilities and provider SDK mechanics behind narrow adapters. Do not chase a reuse percentage.

## Credible first-week technical discovery plan

### Day 1: Run the current system and freeze the facts

- Walk each retained web journey with Patrick or its owner using a non-production account.
- Trace client request, Next.js handler, domain/service code, Prisma writes, provider calls, events, notification, and support visibility.
- Record the current API contract and state transitions. Do not redesign them yet.
- Identify the 30 percent mobile scope and an explicit not-in-launch list.

**Exit evidence:** journey inventory, endpoint map, code owners, environments, and unknowns ranked by money or identity impact.

### Day 2: Map authority and invariants

- For identity, brokerage account, bank link, transfer, order, position, and communication, name the authoritative system and local projection.
- Locate uniqueness constraints, event checkpoints, retry logic, reconciliation jobs, and manual repair paths.
- Inspect actual PlanetScale foreign-key and Prisma relation configuration.
- Classify PII and secrets through logs, analytics, database, and provider payloads.

**Exit evidence:** source-of-truth matrix, state diagrams from existing behavior, and a list of invariants already protected versus missing.

### Day 3: Prove the riskiest platform seams

Build the smallest vertical development-build spike against existing endpoints:

- login, logout, refresh, revocation, and deep-link return;
- one read-only account-status screen;
- one provider-hosted or SDK bank-link handoff if it is in launch scope;
- deployed Expo web origin using the proposed output mode;
- iOS and Android development builds, not Expo Go alone.

**Exit evidence:** recordings and structured logs for all three targets, plus exact platform forks. No broad component library work yet.

### Day 4: Rehearse failure and recovery

- Replay duplicate and out-of-order provider events.
- Drop an SSE connection and resume from the persisted cursor.
- Create a timeout with unknown request outcome and prove no blind retry.
- Compare a local projection with provider query results and run the existing repair path.
- Inspect emitted Axiom and PostHog payloads for forbidden data.

**Exit evidence:** pass or fail table for each invariant and named owners for failures.

### Day 5: Commit scope and release path

- Choose the web output and deployment boundary based on the spike.
- Decide which existing backend behavior remains untouched, which receives adapters, and which gaps block launch.
- Produce vertical milestones ordered by regulatory and financial risk, not screen count.
- Create signed internal or TestFlight builds and prepare store metadata, reviewer access, privacy declarations, and deletion evidence.
- Set daily reconciliation, alert, manual QA, and rollback owners before feature expansion.

**Exit evidence:** a risk-burndown plan with acceptance evidence for each vertical journey and a cut line that never removes an invariant.

## Expo gap primer for Fabricio

Use this to speak honestly: "I have shipped React Native product work, but I have not owned Expo build and release infrastructure. I would close that gap by proving these boundaries in development builds during week one."

1. **Expo is more than a bundler.** It coordinates app config, native modules, routing, development builds, signing and submission workflows. Expo Go does not contain arbitrary native code and is not a production-build substitute. [S5] [S6]
2. **Web has an explicit output model.** `single` is an SPA, `static` emits route HTML without an API server, and `server` requires a runtime server. Confirm the choice before auth and deployment design. [S2]
3. **Universal is not identical.** React Native Web primitives can be shared, but DOM, native modules, permissions, secure storage, and lifecycle behavior need platform files or adapters. [S1] [S4]
4. **Auth must return to the right binary or origin.** Custom schemes, universal links, app links, allowlisted web redirects, and cold-start handling must all be exercised. Expo Go cannot prove the custom-scheme path. [S3]
5. **SecureStore is native only.** Android uses Keystore-backed encrypted preferences and iOS uses Keychain. Uninstall, backup, biometric changes, and payload limits differ. There is no web equivalent. [S4]
6. **Native configuration changes require a rebuild.** Adding a native SDK, permission, or config plugin is release work, not merely JavaScript work. [S5]
7. **Store submission is a separate system.** EAS can build and upload, but legal accounts, metadata, privacy answers, reviewer access, staged release, and production approval still need owners. [S6] [S28] [S30]
8. **First proof:** authentication plus one read-only brokerage state on real iOS, Android, and deployed web, with release-like configuration.

## Alpaca gap primer for Fabricio

Use this to avoid overstating experience: "I have not integrated Alpaca directly. My first move would be to learn Raise's existing wrapper and operational model, then validate Alpaca's account and event state machines in sandbox rather than exposing its API directly to the client."

1. **Broker API is not Trading API for one developer account.** It supports brokerage experiences for end customers, including account opening, funding, and trading. Raise's exact legal and product setup changes the flow. [S12] [S13]
2. **Account opening is asynchronous.** Submission can lead to approval pending or action required before active. The UI must resume this state later and handle document requests. [S13]
3. **Events are SSE, not ordinary one-shot webhooks.** Account, transfer, journal, activity, and trade streams are replayable and require heartbeat, reconnect, cursor, ordering, and identifier-version handling. [S14]
4. **Streams are for timeliness, queries are for recovery.** [INFERENCE] Persist event cursors and dedupe IDs, then reconcile from account, activity, order, position, transfer, and journal APIs after gaps.
5. **Funding and trading are state machines.** A queued or accepted operation is not final cash movement or final execution. Partial fills, declines, reversals, and clearing transitions must remain distinct. [S14]
6. **Operations have a daily clock.** Alpaca documents beginning-of-day sync, funding cutoffs, trade reporting, and end-of-day calculations. Product status and reconciliation must respect those timings. [S15]
7. **Sandbox is necessary but incomplete.** It accelerates contract learning; it does not prove every live timing or operational edge. [S15] [S33]
8. **First proof:** create or use a sandbox account, observe account status through both stream and query, interrupt and replay the stream, exercise an action-required case if enabled, and compare local projection with provider truth. Do this behind the existing backend boundary.

## Questions for Patrick

### Existing system and scope

1. "Could we walk one retained journey end to end, including the current endpoint, database writes, provider calls, async events, and support view? I want to understand what the 80 to 90 percent reuse estimate includes."
2. "Which current web behaviors are explicitly inside the mobile 30 percent, and which financial or regulatory obligations remain even when their UI is out of scope?"
3. "Where has the existing backend already earned trust through production behavior, and where is it carrying known risk that you do not want copied into mobile?"

### Authority, providers, and recovery

4. "For customer identity, available cash, transfer status, orders, positions, and statements, which system is authoritative and which records are local projections?"
5. "What exact Alpaca partner setup and capabilities are enabled for Raise, and which account-opening states or manual reviews occur in production today?"
6. "How are responsibilities divided among Frame, Plaid, and Alpaca? In particular, can more than one of them initiate or represent investment funding?"
7. "How does the current backend survive duplicate events, stream disconnects, ambiguous timeouts, and events that arrive after a local state has advanced?"
8. "What reconciliation runs daily, what does it compare, and what is the human repair path when provider and local state disagree?"
9. "Does Frame's lack of a general idempotency key affect a launch flow, or is it outside investment funding? If it is relevant, what recovery pattern is already in production?"

### Cross-platform and delivery

10. "Which Expo web output and hosting boundary are you expecting, and should the web client share an origin or session boundary with the existing Next.js app?"
11. "What authentication and session mechanism exists today, and how do you want native SecureStore, browser sessions, revocation, and account switching to relate?"
12. "Which selected native SDKs already work in Expo development builds, and which React Native Reusables components have been tested for web focus and native accessibility?"
13. "Who owns EAS, signing, bundle identifiers, store organizations, privacy declarations, reviewer credentials, and rollback after submission?"
14. "Would you be comfortable treating an early signed build and one complete vertical journey as the first milestone, before expanding screen coverage?"

### Operations, privacy, and AI-assisted delivery

15. "Which fields are prohibited in Axiom and PostHog today, and is there an event or logging schema that prevents KYC, bank, account, and token data from entering them?"
16. "Which Twilio and Resend messages are part of a security or regulatory control, and which are best-effort product notifications?"
17. "What production indicators would stop a staged rollout: reconciliation mismatch, account-state lag, event-consumer delay, provider error rate, crash rate, or something else?"
18. "For AI-assisted changes at provider boundaries, what evidence do you want in the PR beyond tests: traced sandbox run, event replay, privacy inspection, manual QA record, or reconciliation output?"

## Sources

- **[S1] Expo:** [Develop websites with Expo](https://docs.expo.dev/workflow/web/) and [platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/). Accessed 2026-08-02.
- **[S2] Expo:** [Publishing websites](https://docs.expo.dev/guides/publishing-websites/) and [static rendering](https://docs.expo.dev/router/web/static-rendering/). Accessed 2026-08-02.
- **[S3] Expo:** [Authentication with OAuth or OpenID providers](https://docs.expo.dev/guides/authentication/) and [AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/). Accessed 2026-08-02.
- **[S4] Expo:** [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/). Accessed 2026-08-02.
- **[S5] Expo:** [Using libraries](https://docs.expo.dev/workflow/using-libraries/) and [development builds](https://docs.expo.dev/develop/development-builds/introduction/). Accessed 2026-08-02.
- **[S6] Expo:** [Submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/). Accessed 2026-08-02.
- **[S7] React Native Reusables:** [official source repository](https://github.com/founded-labs/react-native-reusables), [CLI documentation](https://reactnativereusables.com/docs/cli), and [installation](https://reactnativereusables.com/docs/installation). Accessed 2026-08-02.
- **[S8] Next.js:** [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers). Accessed 2026-08-02.
- **[S9] Vercel:** [Configuring maximum duration for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/duration). Accessed 2026-08-02.
- **[S10] Prisma:** [PlanetScale MySQL guide](https://www.prisma.io/docs/orm/overview/databases/planetscale). Accessed 2026-08-02.
- **[S11] Prisma:** [Transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions). Accessed 2026-08-02.
- **[S12] Alpaca:** [About Broker API](https://docs.alpaca.markets/us/docs/about-broker-api). Accessed 2026-08-02.
- **[S13] Alpaca:** [Customer account opening](https://docs.alpaca.markets/us/docs/account-opening). Accessed 2026-08-02.
- **[S14] Alpaca:** [SSE events](https://docs.alpaca.markets/us/docs/sse-events). Accessed 2026-08-02.
- **[S15] Alpaca:** [Daily processes and reconciliations](https://docs.alpaca.markets/us/docs/daily-processes-and-reconcilations). Accessed 2026-08-02.
- **[S16] Frame:** [Transfers](https://docs.framepayments.com/concepts/money-movement/transfers). Accessed 2026-08-02.
- **[S17] Frame:** [Idempotency](https://docs.framepayments.com/concepts/platform-behavior/idempotency). Accessed 2026-08-02.
- **[S18] Frame:** [Events and webhooks](https://docs.framepayments.com/concepts/platform-behavior/events-and-webhooks). Accessed 2026-08-02.
- **[S19] Frame:** [Bank Accounts API](https://docs.framepayments.com/api-reference/endpoints/bank-accounts). Accessed 2026-08-02.
- **[S20] Plaid:** [Link overview](https://plaid.com/docs/link/) and [React Native Link](https://plaid.com/docs/link/react-native/). Accessed 2026-08-02.
- **[S21] Plaid:** [Sandbox](https://plaid.com/docs/sandbox/) and [webhooks](https://plaid.com/docs/api/webhooks/). Accessed 2026-08-02.
- **[S22] Axiom:** [Vercel integration](https://axiom.co/docs/apps/vercel) and [Next.js logging](https://axiom.co/docs/send-data/nextjs). Accessed 2026-08-02.
- **[S23] PostHog:** [React Native SDK](https://posthog.com/docs/libraries/react-native). Accessed 2026-08-02.
- **[S24] Twilio:** [Secure your app by validating incoming Twilio requests](https://www.twilio.com/docs/usage/security#validating-requests). Accessed 2026-08-02.
- **[S25] Twilio:** [Message status callback requests](https://www.twilio.com/docs/messaging/guides/track-outbound-message-status). Accessed 2026-08-02.
- **[S26] Resend:** [Verify webhooks](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests). Accessed 2026-08-02.
- **[S27] Resend:** [Webhooks introduction](https://resend.com/docs/dashboard/webhooks/introduction). Accessed 2026-08-02.
- **[S28] Apple:** [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Accessed 2026-08-02.
- **[S29] Apple:** [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) and [privacy manifests](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files). Accessed 2026-08-02.
- **[S30] Google Play:** [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311) and [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469). Accessed 2026-08-02.
- **[S31] Google Play:** [Financial services policy](https://support.google.com/googleplay/android-developer/answer/9876821) and [developer account requirements](https://support.google.com/googleplay/android-developer/answer/10788890). Accessed 2026-08-02.
- **[S32] Frame:** [Testing](https://docs.framepayments.com/api-reference/integrations/testing). Accessed 2026-08-02.
- **[S33] Alpaca:** [Getting started with Broker API](https://docs.alpaca.markets/us/docs/getting-started-with-broker-api) and [integration setup](https://docs.alpaca.markets/us/docs/integration-setup-with-alpaca). Accessed 2026-08-02.
