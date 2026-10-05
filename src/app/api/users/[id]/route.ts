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
  cover: true,
  followers: true,
  following: true,
  postsCount: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_PUBLIC_FIELDS,
        _count: {
          select: {
            posts: true,
            connections: true,
            connectedBy: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let isBlocked = false;
    let isFollowing = false;

    if (session?.user?.id && session.user.id !== user.id) {
      const [blockedBy, blocks, connection] = await Promise.all([
        prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: user.id } },
          select: { id: true },
        }),
        prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: user.id, blockedId: session.user.id } },
          select: { id: true },
        }),
        prisma.connection.findUnique({
          where: { userId_connectedUserId: { userId: session.user.id, connectedUserId: user.id } },
          select: { id: true },
        }),
      ]);

      isBlocked = !!blockedBy || !!blocks;
      isFollowing = !!connection;
    }

    if (isBlocked) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          isBlocked: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        cover: user.cover,
        followers: user._count.connectedBy,
        following: user._count.connections,
        postsCount: user._count.posts,
        isOnline: Boolean(user.isOnline && user.lastSeen && (Date.now() - user.lastSeen.getTime()) < 5 * 60 * 1000),
        lastSeen: user.lastSeen?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        isFollowing,
        isOwnProfile: session?.user?.id === user.id,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
