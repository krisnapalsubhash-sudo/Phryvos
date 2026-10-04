import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

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

    const readTimestamp = new Date();

    // Mark all unread messages as read and update lastReadAt atomically
    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId: id,
          receiverId: session.user.id,
          isRead: false,
        },
        data: { isRead: true },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: session.user.id,
          },
        },
        data: { lastReadAt: readTimestamp },
      }),
    ]);

    return NextResponse.json({
      success: true,
      lastReadAt: readTimestamp.toISOString(),
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}