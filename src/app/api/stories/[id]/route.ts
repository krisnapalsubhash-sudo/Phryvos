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
  createdAt: true,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        author: { select: USER_PUBLIC_FIELDS },
        storyViews: session?.user?.id ? {
          where: { userId: session.user.id },
          select: { id: true },
        } : false,
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if expired
    if (story.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Story has expired' }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        author: story.author,
        images: story.images,
        views: story.views,
        hasSeen: session?.user?.id ? Boolean(story.storyViews && story.storyViews.length > 0) : false,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get story error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const story = await prisma.story.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not story owner' }, { status: 403 });
    }

    await prisma.story.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete story error:', error);
    return NextResponse.json(
      { error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}