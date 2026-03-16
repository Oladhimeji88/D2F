import type { FastifyInstance } from "fastify";

import { ok } from "../lib/http";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () =>
    ok({
      status: "ok",
      service: "pagecraft-api",
      timestamp: new Date().toISOString()
    })
  );
}
