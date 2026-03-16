import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  PAGECRAFT_INLINE_JOBS: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  PAGECRAFT_STATE_FILE: z.string().optional(),
  WEB_URL: z.string().url().default("http://localhost:3000")
});

export type ApiEnv = z.infer<typeof envSchema>;

export function getEnv(): ApiEnv {
  return envSchema.parse(process.env);
}
