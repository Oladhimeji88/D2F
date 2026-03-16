import { z } from "zod";

const envSchema = z.object({
  PAGECRAFT_STATE_FILE: z.string().optional(),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(3000)
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function getEnv(): WorkerEnv {
  return envSchema.parse(process.env);
}
