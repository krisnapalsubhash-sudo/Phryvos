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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ReportStatus | null;
    const severity = searchParams.get('severity') as ReportSeverity | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 1. Get from in-memory engine queue
    let reports = safetyEngine.getReportsQueue({
      status: status || undefined,
      severity: severity || undefined,
      limit,
    });

    // 2. Supplement from PostgreSQL Prisma if available
    try {
      const prisma = getPrismaClient();
      if (prisma.report) {
        const dbReports = await prisma.report.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { id: true, username: true, displayName: true } },
            reportedUser: { select: { id: true, username: true, displayName: true } },
          },
        });

        if (dbReports && dbReports.length > 0) {
          // Merge unique reports
          const existingIds = new Set(reports.map((r) => r.id));
          for (const dbr of dbReports) {
            if (!existingIds.has(dbr.id)) {
              reports.push({
                id: dbr.id,
                reporterId: dbr.reporterId,
                reportedUserId: dbr.reportedId,
                reason: dbr.description || dbr.reason,
                category: dbr.reason,
                severity: (dbr.severity as ReportSeverity) || 'MEDIUM',
                status: (dbr.status as ReportStatus) || 'PENDING',
                evidenceSnippet: dbr.evidence || undefined,
                actionTaken: dbr.actionTaken || undefined,
                moderatorNotes: dbr.moderatorNotes || undefined,
                timestamp: dbr.createdAt.toISOString(),
              });
            }
          }
        }
      }
    } catch {}

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

    const result = safetyEngine.reportUser(reporterId, reportedUserId, reason, {
      category,
      evidenceContext,
      isMinorInvolved,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted and queued for moderation review.',
      incident: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
