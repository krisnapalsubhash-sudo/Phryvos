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

    // Find the message request
    const messageRequest = await prisma.messageRequest.findUnique({
      where: { id },
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

    // Update message request status
    await prisma.messageRequest.update({
      where: { id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    });

    // Create notification for sender
    await prisma.notification.create({
      data: {
        userId: messageRequest.senderId,
        actorId: session.user.id,
        type: 'MESSAGE_REQUEST_DECLINED',
        title: 'Message Request Declined',
        body: `${session.user.name || 'Someone'} declined your message request`,
        data: JSON.stringify({ requestId: id }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Decline message request error:', error);
    return NextResponse.json(
      { error: 'Failed to decline message request' },
      { status: 500 }
    );
  }
}