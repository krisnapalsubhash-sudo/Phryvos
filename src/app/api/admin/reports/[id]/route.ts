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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { status, moderatorResponse, actionTaken } = body;

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(moderatorResponse ? { moderatorNotes: moderatorResponse } : {}),
        ...(actionTaken ? { actionTaken } : {}),
      },
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

    // If status changed to RESOLVED or DISMISSED and action was BAN, ban the user
    if ((status === 'RESOLVED' || status === 'DISMISSED') && actionTaken === 'BAN') {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: { isBanned: true, banReason: 'Banned via moderation action' },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Update admin report error:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}