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

    // Get conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: session.user.id },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          where: { userId: { not: session.user.id } },
          include: { user: { select: USER_PUBLIC_FIELDS } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: USER_PUBLIC_FIELDS } },
        },
      },
    });

    let nextCursor: string | undefined;
    if (conversations.length > limit) {
      const nextConv = conversations.pop();
      nextCursor = nextConv!.id;
    }

    // Get unread counts
    const conversationIds = conversations.map((c) => c.id);
    const unreadCounts = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        receiverId: session.user.id,
        isRead: false,
      },
      _count: true,
    });

    const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count]));

    return NextResponse.json({
      success: true,
      conversations: conversations.map((conv) => {
        const otherParticipant = conv.participants[0]?.user;
        const lastMessage = conv.messages[0];

        return {
          id: conv.id,
          participants: [otherParticipant].filter(Boolean),
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            receiverId: lastMessage.receiverId,
            content: lastMessage.content,
            type: lastMessage.type.toLowerCase(),
            timestamp: lastMessage.createdAt.toISOString(),
            isRead: lastMessage.isRead,
          } : undefined,
          unreadCount: unreadMap.get(conv.id) || 0,
          updatedAt: conv.updatedAt.toISOString(),
        };
      }),
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
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
    const { targetUserId, initialMessage } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isBanned: true, isSuspended: true },
    });

    if (!targetUser || targetUser.isBanned || targetUser.isSuspended) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: USER_PUBLIC_FIELDS } },
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversation: {
          id: existingConversation.id,
          participants: existingConversation.participants.map((p) => p.user),
        },
      });
    }

    // Check if there's a pending message request
    const existingRequest = await prisma.messageRequest.findFirst({
      where: {
        senderId: session.user.id,
        receiverId: targetUserId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Message request already sent' }, { status: 409 });
    }

    // Check if there's a connection (mutual follow) - allows direct messaging
    const connection = await prisma.connection.findUnique({
      where: { userId_connectedUserId: { userId: session.user.id, connectedUserId: targetUserId } },
    });

    if (connection) {
      // Direct conversation allowed
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: session.user.id },
              { userId: targetUserId },
            ],
          },
          messages: initialMessage ? {
            create: {
              senderId: session.user.id,
              receiverId: targetUserId,
              content: initialMessage,
              type: 'TEXT',
            },
          } : undefined,
        },
        include: {
          participants: {
            include: { user: { select: USER_PUBLIC_FIELDS } },
          },
        },
      });

      return NextResponse.json({
        success: true,
        conversation: {
          id: conversation.id,
          participants: conversation.participants.map((p) => p.user),
        },
      });
    }

    // No connection - create message request
    const messageRequest = await prisma.messageRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: targetUserId,
        initialMessage: initialMessage || 'Hi! I\'d like to chat.',
        status: 'PENDING',
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        actorId: session.user.id,
        type: 'MESSAGE_REQUEST',
        title: 'New Message Request',
        body: `${session.user.name} wants to message you`,
        data: JSON.stringify({ requestId: messageRequest.id }),
      },
    });

    return NextResponse.json({
      success: true,
      messageRequest: {
        id: messageRequest.id,
        status: messageRequest.status,
      },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}