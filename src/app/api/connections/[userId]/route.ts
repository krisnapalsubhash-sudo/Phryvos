import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId } = await params;

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot unfollow yourself' }, { status: 400 });
    }

    // Check if connection exists
    const existingConnection = await prisma.connection.findUnique({
      where: {
        userId_connectedUserId: {
          userId: session.user.id,
          connectedUserId: targetUserId,
        },
      },
    });

    if (!existingConnection) {
      return NextResponse.json({ error: 'Not following this user' }, { status: 404 });
    }

    // Delete bidirectional connection in a transaction
    await prisma.$transaction([
      // Current user unfollows target
      prisma.connection.delete({
        where: {
          userId_connectedUserId: {
            userId: session.user.id,
            connectedUserId: targetUserId,
          },
        },
      }),
      // Target user unfollows current user (mutual connection)
      prisma.connection.delete({
        where: {
          userId_connectedUserId: {
            userId: targetUserId,
            connectedUserId: session.user.id,
          },
        },
      }),
      // Decrement counters
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          following: { decrement: 1 },
          followers: { decrement: 1 },
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          following: { decrement: 1 },
          followers: { decrement: 1 },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Handle not found (race condition)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}