import type { FastifyInstance } from "fastify";

import { createPageCaptureInputSchema } from "@pagecraft/shared-types";

import { ok } from "../lib/http";
import { CaptureService } from "../services/capture-service";
import { ProjectService } from "../services/project-service";

export async function registerPageRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
  captureService: CaptureService
) {
  app.post("/captures/page", async (request) => {
    const input = createPageCaptureInputSchema.parse(request.body ?? {});
    return ok(await captureService.submitUrlCapture(input));
  });

  app.get("/pages/:id", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.getPage(params.id));
  });

  app.get("/pages/:id/normalized", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.getNormalized(params.id));
  });
}
