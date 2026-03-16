import type { FastifyInstance } from "fastify";

import { crawlStartRequestSchema, pluginCaptureRequestSchema } from "@pagecraft/shared-types";

import { ok } from "../lib/http";
import { CaptureService } from "../services/capture-service";
import { ProjectService } from "../services/project-service";

export async function registerPluginRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
  captureService: CaptureService
) {
  app.get("/plugin/projects", async () => ok(await projectService.listProjects()));

  app.get("/plugin/projects/:id/export", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.buildProjectExport(params.id));
  });

  app.get("/plugin/pages/:id/export", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.buildPageExport(params.id));
  });

  app.post("/plugin/captures/current-tab", async (request) => {
    const input = pluginCaptureRequestSchema.parse(request.body ?? {});
    return ok(await captureService.submitSerializedCapture(input));
  });

  app.post("/plugin/crawls", async (request) => {
    const input = crawlStartRequestSchema.parse(request.body ?? {});
    return ok(await captureService.startCrawl(input));
  });
}
