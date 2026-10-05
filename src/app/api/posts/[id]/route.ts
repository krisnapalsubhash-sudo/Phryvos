import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { updatePostSchema } from '@/lib/auth/validation';

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

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: USER_PUBLIC_FIELDS },
        _count: {
          select: { likes: true, comments: true },
        },
        likes: session?.user?.id ? {
          where: { userId: session.user.id },
          select: { id: true },
        } : false,
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: USER_PUBLIC_FIELDS },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      post: {
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
        isLiked: session?.user?.id ? Boolean(post.likes && post.likes.length > 0) : false,
        isSaved: false,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        comments: post.comments.map((c) => ({
          id: c.id,
          author: c.author,
          content: c.content,
          likes: c.likes,
          isLiked: c.isLiked,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not post owner' }, { status: 403 });
    }

    const { id: _id, voiceWaveform, ...restUpdate } = validation.data;
    const updateData: any = { ...restUpdate };
    if (voiceWaveform !== undefined && voiceWaveform !== null) {
      updateData.voiceWaveform = voiceWaveform;
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: USER_PUBLIC_FIELDS },
      },
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
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
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

    // Check ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not post owner' }, { status: 403 });
    }

    // Atomic transaction: delete post and decrement user postsCount
    await prisma.$transaction([
      prisma.post.delete({
        where: { id },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { postsCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}