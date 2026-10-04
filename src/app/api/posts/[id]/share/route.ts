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

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, shares: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment shares count
    await prisma.post.update({
      where: { id },
      data: { shares: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      shares: post.shares + 1,
    });
  } catch (error) {
    console.error('Share post error:', error);
    return NextResponse.json(
      { error: 'Failed to share post' },
      { status: 500 }
    );
  }
}