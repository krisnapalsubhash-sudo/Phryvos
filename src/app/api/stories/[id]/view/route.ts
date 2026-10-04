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

    let wasAlreadyViewed = false;

    if (session?.user?.id) {
      // Check if user has already viewed this story
      const existingView = await prisma.storyView.findUnique({
        where: {
          storyId_userId: {
            storyId: id,
            userId: session.user.id,
          },
        },
      });

      if (existingView) {
        wasAlreadyViewed = true;
      } else {
        await prisma.storyView.create({
          data: {
            storyId: id,
            userId: session.user.id,
          },
        });
      }
    }

    // Increment views only if not already viewed by this user
    let views = story.views;
    if (!wasAlreadyViewed) {
      const updatedStory = await prisma.story.update({
        where: { id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      views = updatedStory.views;
    }

    return NextResponse.json({
      success: true,
      views,
      hasSeen: true,
    });
  } catch (error) {
    console.error('View story error:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}