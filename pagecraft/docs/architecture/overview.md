# Architecture Overview

## MVP Shape

PageCraft is organized around a small set of composable runtime surfaces:

- `apps/api` exposes project, page, capture, export, and monitoring endpoints.
- `apps/worker` processes queued capture and crawl jobs.
- `apps/web` provides the internal SaaS dashboard.
- `apps/extension` captures authenticated browser state and sends it to the API.
- `apps/plugin` imports backend bundles into Figma.

## Shared Packages

- `packages/shared-types` provides the API and UI data contracts.
- `packages/capture-core` owns the local store, page normalization, token extraction, and crawl helpers.
- `packages/pattern-engine` performs repeated-structure grouping and template clustering.
- `packages/figma-export` converts export bundles into concrete Figma nodes, pages, and styles.

## Data Flow

1. A project is created via the API or dashboard.
2. A page capture is submitted either from a public URL or the Chrome extension.
3. The capture is normalized into `NormalizedCapture`.
4. Style tokens are extracted and stored.
5. Cross-page patterns are recomputed.
6. The dashboard, extension, and plugin consume the same project and page export endpoints.

## Crawl Flow

1. A crawl job is created with same-origin and include/exclude rules.
2. Routes are canonicalized, deduplicated, and queued.
3. The worker fetches pages, captures them, and discovers more routes.
4. Captures feed the pattern engine.
5. Template clusters are derived from page subtree fingerprints.

## Persistence

This MVP currently uses a local JSON store for coherence and speed of iteration. The repository layer was kept explicit so Prisma/PostgreSQL can replace the store without rewriting the API surface.
