import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  // Simple internal metrics snapshot
  const data = metrics.getSnapshot();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics: data,
  });
}
