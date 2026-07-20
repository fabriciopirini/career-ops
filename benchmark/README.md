# Deterministic scan pipeline benchmarks

Plan 005 uses synthetic, versioned fixtures. Runner never calls ATS endpoints, WebSearch, an LLM agent, Playwright navigation, or production writers. It does not read or write `data/`, `reports/`, `output/`, or live tracker files.

## Reproduce

```bash
npm run benchmark -- --iterations=30
npm run benchmark:compare -- benchmark/artifacts/baseline.json benchmark/artifacts/baseline.json
```

The first command runs five warmups followed by 30 measured iterations per workload (provider, URL deduplication, liveness, and separate 250/1,000/5,000-row tracker workloads plus local pipeline) and writes local artifacts to `benchmark/artifacts/`. Override policy when investigating locally with `--warmups=N`, `--iterations=N`, `--output=PATH`, and `--markdown=PATH`. Generated artifacts are ignored; fixtures, source, and tests remain tracked. Reliability checks run against temporary copies of merge/dedup tracker scripts plus injected production persistence/liveness seams; no user files are touched. Default exit mode is `record-only`: known failures are labeled in JSON/Markdown and reported without fabricating pass. Use `--fail-on-reliability` for a strict nonzero exit.

## Fixtures

`benchmark/fixtures/manifest.json` pins fixture version `1.0.0` and lists every synthetic input. Provider records cover invalid siblings, title/location filtering, control characters, same-title distinct URLs, and URL variants. Liveness inputs cover active, expired, short, uncertain, timeout, iframe/custom-control, and localized Apply cases. Tracker documents contain 250, 1,000, and 5,000 rows plus malformed, duplicate, and status-conflict documents. Pipeline candidates cover multi-query duplicates, parser/API overlap, location variants, already-seen URLs, and unsupported providers. `expected/*.json` contains exact accepted/rejected records, reliability expectations, and proxy counts.

## Artifact schema

Each JSON artifact contains:

- `schemaVersion`, `benchmark`, `fixtureVersion`, `network` (`none`), and `command`.
- `environment`: Node version/major, platform, architecture, real `os.release()`, and commit SHA.
- `policy`: warmups, measured iterations, `performance.now`, and nearest-rank percentile policy.
- `telemetry.token_usage` and actual agent/tool telemetry are always `unavailable` unless explicitly supplied runtime integrations are added. `syntheticWorkProxy` counters are fixture instrumentation, not production calls or token counts.
- `reliability.status` is `PASS` or `KNOWN_FAILURES`; `reliability.failures`, `knownFailures`, and each workload's `knownFailures` contain failure IDs, while `failureRecords` associates each ID with its workload and `expected`/`observations` preserve both sides.
- `policy.reliabilityExitMode` records `record-only` or `fail-on-reliability`. Default baseline may exit 0 with `KNOWN_FAILURES`; strict release runs opt into `--fail-on-reliability`.

## Metrics and gates

Latency uses `performance.now()` inside benchmark process. Median and p95 compare independently; unchanged local workload fails when either regresses by more than 10%. Targeted improvement claim is opt-in via `claimsImprovement` and must improve both median and p95. Reliability must have zero expected-fixture failures. `syntheticWorkProxy` is deterministic fixture instrumentation; actual agent/tool telemetry unavailable.
Comparison treats unchanged baseline reliability failures as observed state, fails newly introduced reliability failures, requires failure-ID lists with count agreement, and reports resolved failures explicitly. Evaluation candidates, agent tasks, and liveness calls must not increase for equivalent inputs.
`benchmark/compare.mjs` rejects different fixture versions, benchmark schema versions, Node major versions, platform/architecture/OS release identity, iteration policies, workload sets, or any artifact marked as a live-network run. It reports absolute and percentage latency deltas, reliability changes, synthetic-work-proxy deltas, and actual token deltas only when both artifacts carry real provider telemetry.

Live scan timing is observational context only. It is never a deterministic release gate.
