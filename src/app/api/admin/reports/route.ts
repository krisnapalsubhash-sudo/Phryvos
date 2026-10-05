import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  if (!adminId) return false;

  return userId === adminId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const cursor = searchParams.get('cursor');
    const status = searchParams.get('status');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isBanned: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (reports.length > limit) {
      const nextReport = reports.pop();
      nextCursor = nextReport!.id;
    }

    const formattedReports = reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      description: report.description,
      severity: report.severity,
      status: report.status,
      evidence: report.evidence,
      moderatorNotes: report.moderatorNotes,
      actionTaken: report.actionTaken,
      createdAt: report.createdAt.toISOString(),
      reporter: report.reporter,
      reportedUser: report.reportedUser,
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error: any) {
    console.error('Get admin reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}