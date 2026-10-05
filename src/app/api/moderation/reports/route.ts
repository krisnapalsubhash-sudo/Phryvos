import { NextRequest, NextResponse } from 'next/server';
import { safetyEngine, type ReportStatus, type ReportSeverity } from '@/lib/safety/engine';
import { getPrismaClient } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based access control: only ADMIN or MODERATOR allowed to view moderation reports
    const prisma = getPrismaClient();
    const moderator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!moderator || (moderator.role !== 'ADMIN' && moderator.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden: Moderator privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ReportStatus | null;
    const severity = searchParams.get('severity') as ReportSeverity | null;
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(isNaN(parsedLimit) ? 50 : parsedLimit, 1), 50);

    // 1. Get from durable database backed engine queue
    const reports = await safetyEngine.getReportsQueue({
      status: status || undefined,
      severity: severity || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      total: reports.length,
      reports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportedUserId, reason, category, evidenceContext, isMinorInvolved } = body;
    const reporterId = session.user.id;

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'Missing reportedUserId or reason' },
        { status: 400 }
      );
    }

    if (reportedUserId === reporterId) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    const result = await safetyEngine.reportUser(reporterId, reportedUserId, reason, {
      category,
      evidenceContext,
      isMinorInvolved,
    });

    if ('error' in result && result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.category === 'RATE_LIMITED' ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted and recorded for moderation review.',
      incident: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
