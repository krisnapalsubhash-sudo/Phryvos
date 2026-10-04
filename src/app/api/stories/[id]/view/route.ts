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
    const { id } = await params;

    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, views: true, expiresAt: true },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if expired
    if (story.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Story has expired' }, { status: 410 });
    }

    // Increment views atomically
    const updatedStory = await prisma.story.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });

    // TODO: Track per-user hasSeen in a separate table if needed

    return NextResponse.json({
      success: true,
      views: updatedStory.views,
    });
  } catch (error) {
    console.error('View story error:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}