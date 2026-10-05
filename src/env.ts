import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

// Strict schema in production: No insecure defaults for DB or secrets
const envSchema = z.object({
  DATABASE_URL: isProduction
    ? z.string().min(1, 'DATABASE_URL is required in production')
    : z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/phryvos'),
  NEXTAUTH_URL: isProduction
    ? z.string().url('NEXTAUTH_URL must be a valid URL in production').optional()
    : z.string().optional(),
  NEXTAUTH_SECRET: isProduction
    ? z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters long in production')
    : z.string().min(1).default('development-secret-key-change-in-production-min-32-chars-long'),
  AUTH_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  const formattedError = JSON.stringify(envParsed.error.format(), null, 2);
  if (isProduction && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error(`FATAL: Incomplete or insecure environment variables in production:\n${formattedError}`);
  }
  console.warn('⚠️ Warning: Environment variable validation issue:', formattedError);
}

export const env = envParsed.success
  ? envParsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL || '',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '',
      AUTH_SECRET: process.env.AUTH_SECRET,
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    };


