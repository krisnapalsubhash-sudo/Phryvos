import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

// Helper to check if user is admin
async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  if (!adminId) return false; // No admin configured = no access

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

    // Check if user is admin
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch statistics
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalReports,
      bannedUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.post.count(),
      prisma.report.count(),
      prisma.user.count({ where: { isBanned: true } })
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalPosts,
      reports: totalReports,
      bannedUsers
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}