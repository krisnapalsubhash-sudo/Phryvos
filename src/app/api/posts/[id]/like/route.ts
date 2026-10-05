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
    const userId = session.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, likesCount: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    });

    if (existingLike) {
      // Unlike - remove like and decrement count
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        liked: false,
        likesCount: post.likesCount - 1,
      });
    } else {
      // Like - create like and increment count
      await prisma.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId,
            postId: id,
          },
        });

        await tx.post.update({
          where: { id },
          data: { likesCount: { increment: 1 } },
        });

        if (post.authorId !== userId) {
          await tx.notification.create({
            data: {
              userId: post.authorId,
              actorId: userId,
              type: 'LIKE',
              title: 'New Like',
              body: `${session.user.name || 'Someone'} liked your post`,
              data: JSON.stringify({ postId: id }),
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likesCount: post.likesCount + 1,
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}