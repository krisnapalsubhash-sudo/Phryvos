import { NextRequest, NextResponse } from 'next/server';
import { safetyEngine } from '@/lib/safety/engine';
import { getPrismaClient } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Moderator access required' }, { status: 401 });
    }

    const body = await req.json();
    const { reportId, action, moderatorNotes } = body;
    const moderatorId = session.user.id;

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Missing reportId or action' }, { status: 400 });
    }

    const validActions = ['WARNING_ISSUED', 'TEMPORARY_SUSPENSION', 'PERMANENT_BAN', 'DISMISSED'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // 1. Take action in safety engine
    const result = safetyEngine.takeModeratorAction(
      reportId,
      action as any,
      moderatorNotes || 'Standard moderation procedure applied',
      moderatorId
    );

    if (!result.success) {
      return NextResponse.json({ error: 'Report not found in active moderation queue' }, { status: 404 });
    }

    // 2. Persist audit log & database status update
    try {
      const prisma = getPrismaClient();
      if (prisma.moderationAuditLog) {
        await prisma.moderationAuditLog.create({
          data: {
            moderatorId,
            action,
            targetUserId: result.incident?.reportedUserId || null,
            reportId,
            details: JSON.stringify({
              moderatorNotes,
              timestamp: new Date().toISOString(),
            }),
          },
        });
      }

      // Update Report row if exists
      if (prisma.report) {
        await prisma.report.updateMany({
          where: { id: reportId },
          data: {
            status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED',
            actionTaken: action,
            moderatorNotes,
            resolvedAt: new Date(),
          },
        });
      }
    } catch (dbErr) {
      console.warn('Database audit log deferred:', (dbErr as any)?.message);
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} executed successfully.`,
      incident: result.incident,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
