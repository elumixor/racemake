# racemake

Race telemetry analysis API built with [Hono](https://hono.dev/) and [Bun](https://bun.sh/).

Ingests real-time telemetry frames from a racing session, computes lap summaries, diagnoses sector-level issues (heavy braking, low throttle, tyre overheat, inconsistency), and returns coaching feedback.

## API

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/ingest` | Submit telemetry frames |
| GET | `/laps` | Get completed lap summaries |
| GET | `/analysis` | Get full analysis with coaching |

## Getting started

```bash
bun install
bun run dev
```

The server starts on port **3000**.

## Scripts

| Script | Command |
| ------ | ------- |
| `dev` | `bun run --watch src/index.ts` |
| `lint` | `biome check --write` |
| `format` | `biome format --write` |
| `zip` | `bun scripts/zip.ts` |

## Testing

```bash
bun test
```
