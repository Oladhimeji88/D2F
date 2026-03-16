# API Reference

## Health

- `GET /health`

## Auth

- `POST /auth/dev-login`
- `GET /me`

## Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `DELETE /projects/:id`
- `GET /projects/:id/pages`
- `GET /projects/:id/styles`
- `GET /projects/:id/patterns`
- `GET /projects/:id/warnings`
- `GET /projects/:id/jobs`
- `POST /projects/:id/crawl`

## Pages

- `POST /captures/page`
- `GET /pages/:id`
- `GET /pages/:id/normalized`

## Jobs

- `GET /jobs/:id`

## Plugin / Extension Consumption

- `GET /plugin/projects`
- `GET /plugin/projects/:id/export`
- `GET /plugin/pages/:id/export`
- `POST /plugin/captures/current-tab`
- `POST /plugin/crawls`

## Response Shape

Successful responses follow:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Validation and runtime failures follow:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed."
  }
}
```
