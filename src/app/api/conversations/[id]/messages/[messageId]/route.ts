import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;

    // Verify user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        isDeleted: true,
      },
    });

    if (!message || message.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ success: true, isDeleted: true });
    }

    // Check permissions: sender or admin/moderator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isSender = message.senderId === session.user.id;
    const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

    if (!isSender && !isStaff) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this message' },
        { status: 403 }
      );
    }

    // Perform soft deletion for audit preservation
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.user.id,
        content: 'This message was deleted',
      },
    });

    return NextResponse.json({
      success: true,
      messageId: updated.id,
      isDeleted: true,
      deletedAt: updated.deletedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
