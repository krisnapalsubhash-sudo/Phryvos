import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

// Helper to check if user is admin
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

    // Check if user is admin
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const cursor = searchParams.get('cursor');
    const search = searchParams.get('search') || '';
    const isBanned = searchParams.get('status');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' as const } },
        { displayName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (isBanned === 'true') {
      where.isBanned = true;
    } else if (isBanned === 'false') {
      where.isBanned = false;
    }

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        isBanned: true,
        isOnline: true,
        postsCount: true,
        followers: true,
        following: true,
        avatar: true,
        createdAt: true,
      },
    });

    let nextCursor: string | undefined;
    if (users.length > limit) {
      const nextUser = users.pop();
      nextCursor = nextUser!.id;
    }

    return NextResponse.json({
      success: true,
      users,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error: any) {
    console.error('Get admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}