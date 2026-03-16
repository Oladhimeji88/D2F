import { getEnv } from "./lib/env";
import { createApp } from "./app";

async function bootstrap() {
  const env = getEnv();
  const app = await createApp();
  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });
}

void bootstrap();
