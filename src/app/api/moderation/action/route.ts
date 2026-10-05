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

    // Role-based access control: only ADMIN or MODERATOR allowed
    const prisma = getPrismaClient();
    const moderator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!moderator || (moderator.role !== 'ADMIN' && moderator.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden: Moderator privileges required' }, { status: 403 });
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

    // 1. Take action in safety engine with durable DB transaction
    const result = await safetyEngine.takeModeratorAction(
      reportId,
      action as any,
      moderatorNotes || 'Standard moderation procedure applied',
      moderatorId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Report not found in database or moderation queue' },
        { status: 404 }
      );
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
