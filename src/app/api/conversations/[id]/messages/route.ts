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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages with deterministic cursor pagination
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        sender: { select: USER_PUBLIC_FIELDS },
      },
    });

    let nextCursor: string | undefined;
    if (messages.length > limit) {
      const nextMsg = messages.pop();
      nextCursor = nextMsg!.id;
    }

    // Get other participant
    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: { not: session.user.id },
      },
      include: { user: { select: USER_PUBLIC_FIELDS } },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.isDeleted ? 'This message was deleted' : msg.content,
        isDeleted: msg.isDeleted,
        type: msg.type.toLowerCase(),
        timestamp: msg.createdAt.toISOString(),
        isRead: msg.isRead,
        sender: msg.sender,
      })),
      participant: otherParticipant?.user,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, type = 'TEXT', clientMessageId } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message exceeds maximum length of 5000 characters' }, { status: 400 });
    }

    // Verify sender is an active participant in this conversation
    const senderParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!senderParticipant) {
      return NextResponse.json({ error: 'Forbidden: You are not a participant in this conversation' }, { status: 403 });
    }

    // Identify recipient(s) in this 1:1 / direct conversation
    const recipientParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: { not: session.user.id },
      },
    });

    if (!recipientParticipant) {
      return NextResponse.json({ error: 'No recipient found in conversation' }, { status: 400 });
    }

    const { conversationService } = await import('@/lib/services/conversationService');
    const message = await conversationService.sendMessage({
      conversationId,
      senderId: session.user.id,
      receiverId: recipientParticipant.userId,
      content: content.trim(),
      type: type as any,
      clientMessageId: typeof clientMessageId === 'string' ? clientMessageId.slice(0, 100) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.isDeleted ? 'This message was deleted' : message.content,
        isDeleted: message.isDeleted,
        type: message.type.toLowerCase(),
        timestamp: message.createdAt.toISOString(),
        isRead: message.isRead,
        sender: message.sender,
      },
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}