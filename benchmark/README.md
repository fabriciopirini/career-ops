# Deterministic scan pipeline benchmarks

Plan 005 uses synthetic, versioned fixtures. Runner never calls ATS endpoints, WebSearch, an LLM agent, Playwright navigation, or production writers. It does not read or write `data/`, `reports/`, `output/`, or live tracker files.

## Reproduce

```bash
npm run benchmark -- --iterations=30
npm run benchmark:compare -- benchmark/artifacts/baseline.json benchmark/artifacts/baseline.json
```

The first command runs five warmups followed by 30 measured iterations per workload and writes local artifacts to `benchmark/artifacts/`. Override policy when investigating locally with `--warmups=N`, `--iterations=N`, `--output=PATH`, and `--markdown=PATH`. Generated artifacts are ignored; fixtures, source, and tests remain tracked.

## Fixtures

`benchmark/fixtures/manifest.json` pins fixture version `1.0.0` and lists every synthetic input. Provider records cover invalid siblings, title/location filtering, control characters, same-title distinct URLs, and URL variants. Liveness inputs cover active, expired, short, uncertain, timeout, iframe/custom-control, and localized Apply cases. Tracker documents contain 250, 1,000, and 5,000 rows plus malformed, duplicate, and status-conflict documents. Pipeline candidates cover multi-query duplicates, parser/API overlap, location variants, already-seen URLs, and unsupported providers. `expected/*.json` contains exact accepted/rejected records, reliability expectations, and proxy counts.

## Artifact schema

Each JSON artifact contains:

- `schemaVersion`, `benchmark`, `fixtureVersion`, `network` (`none`), and `command`.
- `environment`: Node version/major, platform, release, and commit SHA.
- `policy`: warmups, measured iterations, `performance.now`, and nearest-rank percentile policy.
- `telemetry.token_usage`: always `unavailable` unless an explicitly supplied runtime telemetry integration is added. This runner never infers tokens.
- `reliability`: exact expected-fixture check IDs and a `failures` array. A successful deterministic run has no reliability failures.

Timing fields are measured and therefore allowed to vary. Fixture outputs, reliability counts, proxy counters, policy, and compatibility metadata are deterministic for a fixed source/Node environment. The benchmark records no fabricated token field.

## Metrics and gates

Latency uses `performance.now()` inside the benchmark process. Median and p95 are compared independently; an unchanged local workload fails when either regresses by more than 10%. A targeted improvement claim is opt-in via `claimsImprovement` in the candidate workload and must improve both median and p95. Reliability must have zero expected-fixture failures. Evaluation candidates, agent tasks, and liveness calls must not increase for equivalent inputs. Tool calls, WebSearch query counts, source records, duplicate drops, and manifest characters are deterministic work proxies, not token counts.

`benchmark/compare.mjs` rejects different fixture versions, benchmark schema versions, Node major versions, iteration policies, workload sets, or any artifact marked as a live-network run. It reports absolute and percentage latency deltas, reliability changes, work-proxy deltas, and actual token deltas only when both artifacts carry real provider telemetry.

Live scan timing is observational context only. It is never a deterministic release gate.
