import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { searchUsersSchema } from '@/lib/auth/validation';

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
    const { searchParams } = new URL(request.url);

    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = searchUsersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { q, cursor, limit, isOnline } = validation.data;

    // Build where clause
    const where: any = {};

    // Text search on username, displayName, location, interests
    if (q) {
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { interests: { hasSome: [q] } },
      ];
    }

    // Filter by online status
    if (isOnline !== undefined) {
      where.isOnline = isOnline;
    }

    // Exclude current user from results
    if (session?.user?.id) {
      where.id = { not: session.user.id };

      // Exclude blocked users
      where.AND = [
        {
          NOT: {
            blockedBy: {
              some: {
                blockerId: session.user.id,
              },
            },
          },
        },
        {
          NOT: {
            blocks: {
              some: {
                blockedId: session.user.id,
              },
            },
          },
        },
      ];
    }

    // Exclude banned/suspended users
    where.isBanned = false;
    where.isSuspended = false;

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: USER_PUBLIC_FIELDS,
    });

    let nextCursor: string | undefined;
    if (users.length > limit) {
      const nextUser = users.pop();
      nextCursor = nextUser!.id;
    }

    // Add connection status for each user if authenticated
    let usersWithConnection = users;
    if (session?.user?.id) {
      const userIds = users.map((u) => u.id);
      const connections = await prisma.connection.findMany({
        where: {
          userId: session.user.id,
          connectedUserId: { in: userIds },
        },
        select: { connectedUserId: true },
      });
      const connectedIds = new Set(connections.map((c) => c.connectedUserId));

      usersWithConnection = users.map((u) => ({
        ...u,
        isFollowing: connectedIds.has(u.id),
      }));
    }

    return NextResponse.json({
      success: true,
      users: usersWithConnection.map((u) => ({
        ...u,
        isOnline: Boolean(u.isOnline && u.lastSeen && (Date.now() - u.lastSeen.getTime()) < 5 * 60 * 1000),
        createdAt: u.createdAt.toISOString(),
        lastSeen: u.lastSeen?.toISOString() || null,
      })),
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}