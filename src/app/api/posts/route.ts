import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { createPostSchema } from '@/lib/auth/validation';

const prisma = getPrismaClient();

// Public user fields for serialization
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

    const cursor = searchParams.get('cursor');
    // Enforce 1 <= limit <= 50 bounds
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 50);
    const format = searchParams.get('format') as 'STANDARD' | 'RAW' | 'VOICE' | 'MIDNIGHT' | null;
    const followingOnly = searchParams.get('following') === 'true';
    const vibe = searchParams.get('vibe');

    const where: any = {};

    // Filter by format if specified
    if (format) {
      where.format = format;
    }

    // Filter by vibe if specified
    if (vibe) {
      where.vibe = vibe;
    }

    // Filter to only posts from followed users
    if (followingOnly && session?.user?.id) {
      where.author = {
        connectedBy: {
          some: {
            userId: session.user.id,
          },
        },
      };
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

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        author: { select: USER_PUBLIC_FIELDS },
        _count: {
          select: { likes: true, comments: true },
        },
        likes: session?.user?.id ? {
          where: { userId: session.user.id },
          select: { id: true },
        } : false,
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextPost = posts.pop();
      nextCursor = nextPost!.id;
    }

    const ANONYMOUS_AUTHOR = {
      id: 'anonymous',
      username: 'anonymous',
      displayName: 'Anonymous',
      avatar: '👤',
      bio: '',
      location: '',
      interests: [],
      followers: 0,
      following: 0,
      postsCount: 0,
      isOnline: false,
      createdAt: new Date(0).toISOString(),
    };

    // Format response with strict anonymous masking
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      author: post.isAnonymous && post.author.id !== session?.user?.id
        ? ANONYMOUS_AUTHOR
        : post.author,
      content: post.content,
      image: post.image,
      format: post.format,
      audioDuration: post.audioDuration,
      voiceWaveform: post.voiceWaveform,
      midnightGradient: post.midnightGradient,
      isAnonymous: post.isAnonymous,
      readingTime: post.readingTime,
      vibe: post.vibe,
      tags: post.tags,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      shares: post.shares,
      isLiked: session?.user?.id ? post.likes.length > 0 : false,
      isSaved: false, // TODO: add saves
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      content,
      format,
      image,
      audioDuration,
      voiceWaveform,
      midnightGradient,
      isAnonymous,
      readingTime,
      vibe,
      tags,
    } = validation.data;

    // Atomic transaction: create post and increment user postsCount
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId: session.user.id,
          content,
          format,
          image,
          audioDuration,
          voiceWaveform: voiceWaveform ?? [],
          midnightGradient,
          isAnonymous,
          readingTime,
          vibe,
          tags,
        },
        include: {
          author: { select: USER_PUBLIC_FIELDS },
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { postsCount: { increment: 1 } },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        author: post.author,
        content: post.content,
        image: post.image,
        format: post.format,
        audioDuration: post.audioDuration,
        voiceWaveform: post.voiceWaveform,
        midnightGradient: post.midnightGradient,
        isAnonymous: post.isAnonymous,
        readingTime: post.readingTime,
        vibe: post.vibe,
        tags: post.tags,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        shares: post.shares,
        isLiked: false,
        isSaved: false,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}