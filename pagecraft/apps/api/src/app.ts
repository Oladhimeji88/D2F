import Fastify from "fastify";
import { ZodError } from "zod";

import { ApiError } from "./lib/errors";
import { getEnv } from "./lib/env";
import { fail } from "./lib/http";
import { createStoreRepository } from "./repositories/store-repository";
import { registerAuthRoutes } from "./routes/auth";
import { registerHealthRoutes } from "./routes/health";
import { registerJobRoutes } from "./routes/jobs";
import { registerPageRoutes } from "./routes/pages";
import { registerPluginRoutes } from "./routes/plugin";
import { registerProjectRoutes } from "./routes/projects";
import { AuthService } from "./services/auth-service";
import { CaptureService } from "./services/capture-service";
import { JobService } from "./services/job-service";
import { ProjectService } from "./services/project-service";

export async function createApp() {
  const env = getEnv();
  const app = Fastify({
    logger: false
  });

  const allowedOrigins = new Set([
    env.WEB_URL,
    // Chrome extensions use this scheme; add specific extension IDs via WEB_URL or extend as needed
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : [])
  ]);

  app.addHook("onRequest", async (request, reply) => {
    const requestOrigin = typeof request.headers.origin === "string" ? request.headers.origin : "";
    const corsOrigin = allowedOrigins.has(requestOrigin) ? requestOrigin : env.WEB_URL;
    reply.header("Access-Control-Allow-Origin", corsOrigin);
    reply.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    reply.header("Vary", "Origin");

    if (request.method === "OPTIONS") {
      return reply.status(204).send();
    }
  });

  const repository = createStoreRepository();
  const projectService = new ProjectService(repository);
  const authService = new AuthService(repository);
  const jobService = new JobService(repository, env);
  const captureService = new CaptureService(repository, jobService);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send(fail(error.code, error.message, error.details));
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send(fail("VALIDATION_ERROR", "Request validation failed.", error.flatten()));
      return;
    }

    reply.status(500).send(fail("INTERNAL_ERROR", error.message || "Unexpected API error."));
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app, authService);
  await registerProjectRoutes(app, projectService, captureService);
  await registerPageRoutes(app, projectService, captureService);
  await registerJobRoutes(app, projectService);
  await registerPluginRoutes(app, projectService, captureService);

  return app;
}
