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

    // Delete only the directed connection in a transaction
    await prisma.$transaction(async (tx: any) => {
      await tx.connection.delete({
        where: {
          userId_connectedUserId: {
            userId: session.user.id,
            connectedUserId: targetUserId,
          },
        },
      });
      // Decrement only the actor's following count and the target's followers count
      await tx.user.update({
        where: { id: session.user.id },
        data: { following: { decrement: 1 } },
      });
      await tx.user.update({
        where: { id: targetUserId },
        data: { followers: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Handle not found (race condition)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    // Roll back partial transaction — rethrow for top-level catch
    throw error;
  }
}