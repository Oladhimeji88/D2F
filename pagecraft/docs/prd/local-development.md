# Local Development Setup

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop or compatible Docker runtime

## Install

```bash
pnpm install
```

Create `.env` from `.env.example`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

## Start Infrastructure

```bash
docker compose up -d
```

The MVP does not require Postgres or Redis to run locally today, but the compose stack is included to preserve the intended production topology.

## Run Services

API:

```bash
pnpm dev:api
```

Worker:

```bash
pnpm dev:worker
```

Dashboard:

```bash
pnpm dev:web
```

## Seeded Demo State

The first API startup creates `.pagecraft-dev/state.json` with a demo project, captures, styles, patterns, jobs, crawl runs, and warnings. Remove it with:

```bash
pnpm state:reset
```
