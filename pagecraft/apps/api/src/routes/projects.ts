import type { FastifyInstance } from "fastify";

import { createProjectInputSchema, crawlSettingsSchema, startCrawlInputSchema } from "@pagecraft/shared-types";

import { ok } from "../lib/http";
import { ProjectService } from "../services/project-service";
import { CaptureService } from "../services/capture-service";

export async function registerProjectRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
  captureService: CaptureService
) {
  app.get("/projects", async () => ok(await projectService.listProjects()));

  app.post("/projects", async (request) => {
    const input = createProjectInputSchema.parse(request.body ?? {});
    return ok(await projectService.createProject(input));
  });

  app.get("/projects/:id", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.getProject(params.id));
  });

  app.delete("/projects/:id", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.deleteProject(params.id));
  });

  app.get("/projects/:id/pages", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.listPages(params.id));
  });

  app.get("/projects/:id/styles", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.listStyles(params.id));
  });

  app.get("/projects/:id/patterns", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.listPatterns(params.id));
  });

  app.get("/projects/:id/warnings", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.listWarnings(params.id));
  });

  app.get("/projects/:id/jobs", async (request) => {
    const params = request.params as { id: string };
    return ok(await projectService.listJobs(params.id));
  });

  app.post("/projects/:id/crawl", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = startCrawlInputSchema.parse({
      projectId: params.id,
      rootUrl: body.rootUrl,
      settings: crawlSettingsSchema.parse(body.settings ?? {})
    });

    return ok(
      await captureService.startCrawl({
        projectId: input.projectId,
        siteOrigin: input.rootUrl,
        tabUrl: input.rootUrl,
        routes: [
          {
            url: input.rootUrl,
            pathname: new URL(input.rootUrl).pathname || "/",
            depth: 0,
            source: "manual",
            skippedReason: null
          }
        ],
        settings: input.settings
      })
    );
  });
}
