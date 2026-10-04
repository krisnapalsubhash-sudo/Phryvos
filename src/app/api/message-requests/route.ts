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
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Get pending requests received by current user
    const requests = await prisma.messageRequest.findMany({
      where: {
        receiverId: session.user.id,
        status: 'PENDING',
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: USER_PUBLIC_FIELDS },
      },
    });

    let nextCursor: string | undefined;
    if (requests.length > limit) {
      const nextReq = requests.pop();
      nextCursor = nextReq!.id;
    }

    return NextResponse.json({
      success: true,
      requests: requests.map((req) => ({
        id: req.id,
        sender: req.sender,
        initialMessage: req.initialMessage,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get message requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message requests' },
      { status: 500 }
    );
  }
}