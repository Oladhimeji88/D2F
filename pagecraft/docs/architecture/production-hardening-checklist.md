# Production Hardening Checklist

- Replace the JSON store with Prisma/PostgreSQL.
- Move queued job state to Redis/BullMQ.
- Reintroduce Playwright-backed public capture with browser-isolated workers.
- Add structured logging, request IDs, and tracing.
- Add authentication and authorization across dashboard, extension, and plugin flows.
- Add S3-backed binary storage for screenshots and raw capture payloads.
- Add retry and dead-letter behavior for capture and crawl jobs.
- Add rate limiting and tenant-aware quotas.
- Expand integration tests around crawl depth, route filters, and export bundle stability.
- Add background cleanup for stale artifacts and temporary payloads.
