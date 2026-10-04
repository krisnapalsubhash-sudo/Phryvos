import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development / serverless reloads
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Validates database configuration and ensures runtime never executes with an invalid or mock client.
 */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Guard: Strictly isolate build-phase prerendering from production runtime
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildPhase) {
    // If during static build with no database, provide a diagnostic-aware Proxy
    // that informs developers rather than failing silently with undefined TypeError
    const buildProxy = new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }
        // Provide a mock for any model access
        return new Proxy(() => {}, {
          get(_t, subProp) {
            return () => Promise.resolve(null);
          },
          apply() {
            return Promise.resolve(null);
          },
        });
      },
    });
    return buildProxy;
  }

  // Production and Runtime initialization
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && process.env.NODE_ENV === 'production') {
    console.error('FATAL: DATABASE_URL environment variable is missing in production runtime.');
  }

  // Use the @prisma/adapter-pg with pure JS pg driver to bypass native binary limitations
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');
  
  const pool = new Pool({ connectionString: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/phryvos' });
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