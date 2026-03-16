import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("pagecraft api", () => {
  let stateDir = "";
  beforeEach(async () => {
    stateDir = await mkdtemp(join(tmpdir(), "pagecraft-api-"));
    process.env.PAGECRAFT_STATE_FILE = join(stateDir, "state.json");
    process.env.PAGECRAFT_INLINE_JOBS = "true";
    process.env.WEB_URL = "http://localhost:3000";
  });

  afterEach(async () => {
    await rm(stateDir, { recursive: true, force: true });
  });

  it("returns health status", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe("ok");
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("responds to CORS preflight requests", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "OPTIONS",
      url: "/projects",
      headers: {
        origin: "https://www.figma.com"
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
    expect(response.headers["access-control-allow-origin"]).toBe("https://www.figma.com");
  });

  it("creates projects and returns them from the project list", async () => {
    const app = await createApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/projects",
      payload: {
        name: "Acme SaaS",
        rootUrl: "https://acme.example.com"
      }
    });

    expect(createResponse.statusCode).toBe(200);
    const created = createResponse.json().data;

    const listResponse = await app.inject({
      method: "GET",
      url: "/projects"
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data.some((project: { id: string }) => project.id === created.id)).toBe(true);
  });

  it("surfaces validation errors through the centralized handler", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "POST",
      url: "/projects",
      payload: {
        name: "x"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });
});
