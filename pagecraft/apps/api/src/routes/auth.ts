import type { FastifyInstance } from "fastify";

import { devLoginInputSchema } from "@pagecraft/shared-types";

import { ok } from "../lib/http";
import { AuthService } from "../services/auth-service";

export async function registerAuthRoutes(app: FastifyInstance, authService: AuthService) {
  app.post("/auth/dev-login", async (request) => {
    const input = devLoginInputSchema.parse(request.body ?? {});
    return ok(await authService.devLogin(input));
  });

  app.get("/me", async () => ok(await authService.me()));
}
