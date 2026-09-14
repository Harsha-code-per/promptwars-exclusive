import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')).optional().or(z.literal('')).default(''),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  RATE_LIMIT_RPM: z.coerce.number().default(60),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${errors}`);
    }
    _config = parsed.data;
  }
  return _config;
}

/** Reset config cache — used for testing */
export function resetConfig(): void {
  _config = null;
}
