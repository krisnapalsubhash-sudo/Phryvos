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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {
      expiresAt: { gt: new Date() }, // Only active (non-expired) stories
    };

    if (userId) {
      where.authorId = userId;
    }

    // Exclude blocked users
    if (session?.user?.id) {
      where.AND = [
        {
          author: {
            NOT: {
              blockedBy: {
                some: {
                  blockerId: session.user.id,
                },
              },
            },
          },
        },
        {
          author: {
            NOT: {
              blocks: {
                some: {
                  blockedId: session.user.id,
                },
              },
            },
          },
        },
      ];
    }

    const stories = await prisma.story.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: USER_PUBLIC_FIELDS },
        storyViews: session?.user?.id
          ? {
              where: { userId: session.user.id },
              select: { id: true },
            }
          : false,
      },
    });

    let nextCursor: string | undefined;
    if (stories.length > limit) {
      const nextStory = stories.pop();
      nextCursor = nextStory!.id;
    }

    return NextResponse.json({
      success: true,
      stories: stories.map((story) => ({
        id: story.id,
        author: story.author,
        images: story.images,
        views: story.views,
        hasSeen: Boolean(story.storyViews && story.storyViews.length > 0),
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      })),
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { images, expiresAt } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Default expiry: 24 hours
    const expiry = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        authorId: session.user.id,
        images,
        expiresAt: expiry,
      },
      include: {
        author: { select: USER_PUBLIC_FIELDS },
      },
    });

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        author: story.author,
        images: story.images,
        views: story.views,
        hasSeen: false,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}