import { PrismaClient } from '@prisma/client';
import { env } from '@/env'; // Validate environment variables

// Prevent multiple instances of Prisma Client in development / serverless reloads
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Validates database configuration and ensures runtime never executes with an invalid or mock client.
 */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Production and Runtime initialization
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('FATAL: DATABASE_URL environment variable is missing.');
  }

  // Use the @prisma/adapter-pg with pure JS pg driver to bypass native binary limitations
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');
  
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  // Handle graceful process disconnection on shutdown
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    const cleanup = async () => {
      try {
        await client.$disconnect();
      } catch {}
    };
    process.on('beforeExit', cleanup);
  }

  globalForPrisma.prisma = client;
  return client;
}

/**
 * Health check helper to verify active database connectivity and latency
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const client = getPrismaClient();
  const startTime = Date.now();

  try {
    // Simple 1-query ping
    await client.$queryRaw`SELECT 1`;
    return {
      ok: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - startTime,
      error: err?.message || 'Database unreachable',
    };
  }
}

export const prisma = getPrismaClient();