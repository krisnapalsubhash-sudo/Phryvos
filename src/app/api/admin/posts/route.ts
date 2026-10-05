import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  if (!adminId) return false;

  return userId === adminId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const cursor = searchParams.get('cursor');
    const format = searchParams.get('format');

    const where: any = {};
    if (format) {
      where.format = format;
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isBanned: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextPost = posts.pop();
      nextCursor = nextPost!.id;
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      format: post.format,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      shares: post.shares,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.author.id,
        username: post.author.username,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
        isBanned: post.author.isBanned,
      },
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error: any) {
    console.error('Get admin posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}