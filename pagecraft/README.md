# PageCraft

PageCraft is a production-oriented monorepo MVP for converting websites into editable Figma artifacts. The current repository includes:

- `apps/api`: Fastify API for projects, pages, captures, exports, jobs, and crawl orchestration
- `apps/worker`: background worker for queued capture and crawl jobs
- `apps/web`: Next.js dashboard for monitoring projects, pages, jobs, warnings, and patterns
- `apps/extension`: Chrome extension for authenticated current-tab capture and crawl route discovery
- `apps/plugin`: Figma plugin for importing pages, style guides, and components
- `packages/capture-core`: shared local store, capture normalization, token extraction, and crawl helpers
- `packages/pattern-engine`: repeated subtree detection and template clustering
- `packages/shared-types`: shared Zod schemas and TypeScript contracts
- `packages/figma-export`: Figma node factory and style guide/component builders

## Local Setup

```bash
pnpm install
pnpm dev:api
pnpm dev:web
pnpm dev:worker
```

Create `.env` from `.env.example` before starting services.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

The API seeds a demo project on first run using a local JSON state file at `.pagecraft-dev/state.json`.

## Useful Commands

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm state:reset
docker compose up -d
```

## MVP Notes

- The current MVP uses a local JSON-backed repository instead of the previously planned database layer.
- Inline job execution can be enabled with `PAGECRAFT_INLINE_JOBS=true` for simple local development.
- The worker can process queued jobs independently when inline jobs are disabled.

## Docs

- [Architecture Overview](./docs/architecture/overview.md)
- [Local Development Setup](./docs/prd/local-development.md)
- [API Reference](./docs/api/reference.md)
- [Extension Usage](./docs/architecture/extension-usage.md)
- [Plugin Usage](./docs/architecture/plugin-usage.md)
- [Known Limitations](./docs/architecture/known-limitations.md)
- [Production Hardening Checklist](./docs/architecture/production-hardening-checklist.md)
