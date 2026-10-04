import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

const USER_PUBLIC_FIELDS = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  bio: true,
  location: true,
  interests: true,
  followers: true,
  following: true,
  postsCount: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get connections where current user is the follower
    const connections = await prisma.connection.findMany({
      where: { userId: session.user.id },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { connectedAt: 'desc' },
      include: {
        connectedUser: { select: USER_PUBLIC_FIELDS },
      },
    });

    let nextCursor: string | undefined;
    if (connections.length > limit) {
      const nextConn = connections.pop();
      nextCursor = nextConn!.id;
    }

    return NextResponse.json({
      success: true,
      connections: connections.map((c) => ({
        id: c.id,
        user: c.connectedUser,
        connectedAt: c.connectedAt.toISOString(),
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt?.toISOString() || null,
      })),
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get connections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already connected
    const existingConnection = await prisma.connection.findUnique({
      where: {
        userId_connectedUserId: {
          userId: session.user.id,
          connectedUserId: targetUserId,
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json({
        success: true,
        message: 'Already connected with this user',
        connected: true,
      });
    }

    // Check if blocked either way
    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetUserId } },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: targetUserId, blockedId: session.user.id } },
      }),
    ]);

    if (blockedByMe || blockedMe) {
      return NextResponse.json({ error: 'Cannot follow this user' }, { status: 403 });
    }

    // Create bidirectional connection in a transaction
    await prisma.$transaction([
      // Current user follows target
      prisma.connection.create({
        data: {
          userId: session.user.id,
          connectedUserId: targetUserId,
        },
      }),
      // Target user follows current user (mutual connection)
      prisma.connection.create({
        data: {
          userId: targetUserId,
          connectedUserId: session.user.id,
        },
      }),
      // Increment counters
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          following: { increment: 1 },
          followers: { increment: 1 },
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          following: { increment: 1 },
          followers: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({ success: true, connected: true });
  } catch (error: any) {
    // Handle unique constraint violation (race condition / concurrent follow) idempotently
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: true,
        message: 'Already connected with this user',
        connected: true,
      });
    }
    console.error('Follow user error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}