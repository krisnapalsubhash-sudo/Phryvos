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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the message request
    const messageRequest = await prisma.messageRequest.findUnique({
      where: { id },
      include: { sender: { select: USER_PUBLIC_FIELDS } },
    });

    if (!messageRequest) {
      return NextResponse.json({ error: 'Message request not found' }, { status: 404 });
    }

    // Verify user is the receiver
    if (messageRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (messageRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    // Execute atomically
    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          participants: {
            create: [
              { userId: session.user.id },
              { userId: messageRequest.senderId },
            ],
          },
          messages: {
            create: {
              senderId: messageRequest.senderId,
              receiverId: session.user.id,
              content: messageRequest.initialMessage,
              type: 'TEXT',
            },
          },
        },
        include: {
          participants: {
            include: { user: { select: USER_PUBLIC_FIELDS } },
          },
        },
      });

      await tx.messageRequest.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      // Upsert connections to avoid unique constraint violations
      const existingConn1 = await tx.connection.findUnique({
        where: { userId_connectedUserId: { userId: session.user.id, connectedUserId: messageRequest.senderId } }
      });
      if (!existingConn1) {
        await tx.connection.create({ data: { userId: session.user.id, connectedUserId: messageRequest.senderId } });
        await tx.user.update({ where: { id: session.user.id }, data: { following: { increment: 1 } } });
        await tx.user.update({ where: { id: messageRequest.senderId }, data: { followers: { increment: 1 } } });
      }

      const existingConn2 = await tx.connection.findUnique({
        where: { userId_connectedUserId: { userId: messageRequest.senderId, connectedUserId: session.user.id } }
      });
      if (!existingConn2) {
        await tx.connection.create({ data: { userId: messageRequest.senderId, connectedUserId: session.user.id } });
        await tx.user.update({ where: { id: messageRequest.senderId }, data: { following: { increment: 1 } } });
        await tx.user.update({ where: { id: session.user.id }, data: { followers: { increment: 1 } } });
      }

      await tx.notification.create({
        data: {
          userId: messageRequest.senderId,
          actorId: session.user.id,
          type: 'MESSAGE_REQUEST_ACCEPTED',
          title: 'Message Request Accepted',
          body: `${session.user.name || 'Someone'} accepted your message request`,
          data: JSON.stringify({ conversationId: conv.id }),
        },
      });

      return conv;
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        participants: conversation.participants.map((p) => p.user),
      },
    });
  } catch (error) {
    console.error('Accept message request error:', error);
    return NextResponse.json(
      { error: 'Failed to accept message request' },
      { status: 500 }
    );
  }
}