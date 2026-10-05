import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    const where: any = { userId: session.user.id };
    if (unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (notifications.length > limit) {
      const nextNotif = notifications.pop();
      nextCursor = nextNotif!.id;
    }

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        actor: n.actor,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ? JSON.parse(n.data) : undefined,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { readAll } = body;

    if (readAll === true) {
      // Mark all unread notifications for current user as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Patch notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
