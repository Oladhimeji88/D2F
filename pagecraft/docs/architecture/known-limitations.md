# Known Limitations

- The current MVP persists to a local JSON store instead of PostgreSQL/Redis.
- Public URL capture uses lightweight HTML fetching and does not yet reproduce browser-accurate computed styles the way Playwright would.
- Screenshot previews are generated placeholders unless richer capture data is provided.
- Authentication is a development placeholder.
- Billing and settings are structural placeholders only.
- Crawl jobs currently process sequentially rather than with high-throughput queue concurrency.
- Style extraction is intentionally pragmatic and does not yet infer a full design token taxonomy.
