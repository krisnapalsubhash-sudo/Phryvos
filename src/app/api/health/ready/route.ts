import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';

export async function GET() {
  const startTime = Date.now();
  try {
    const prisma = getPrismaClient();

    // Query database with 2-second timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database ping timeout')), 2000)),
    ]);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'ready',
        service: 'phryvos',
        database: 'healthy',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Readiness probe failure:', error?.message || error);
    return NextResponse.json(
      {
        status: 'unready',
        service: 'phryvos',
        database: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
