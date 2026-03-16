import type { FastifyInstance } from "fastify";

import { ok } from "../lib/http";
import { ProjectService } from "../services/project-service";

export async function registerJobRoutes(app: FastifyInstance, projectService: ProjectService) {
  app.get("/jobs/:id", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.getJob(params.id));
  });
}
