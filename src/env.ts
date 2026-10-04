import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/phryvos'),
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1).default('phryvos-default-secret-key-32-chars-min'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.warn('⚠️ Warning: Incomplete environment variables detected:', JSON.stringify(envParsed.error.format(), null, 2));
}

export const env = envParsed.success
  ? envParsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/phryvos',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'phryvos-default-secret-key-32-chars-min',
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    };

