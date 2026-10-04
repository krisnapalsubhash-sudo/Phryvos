import { getPrismaClient } from '@/lib/db/prisma';
import { privacyService } from '@/lib/safety/privacyService';
import type { PostFormat } from '@prisma/client';

export interface FeedQueryOptions {
  limit?: number;
  cursor?: string;
  format?: PostFormat;
  authorId?: string;
  viewerId?: string;
}

export class PostService {
  /**
   * Fetch optimized feed with index utilization, pagination, and blocklist filtering
   */
  public async getFeed(options: FeedQueryOptions = {}) {
    const prisma = getPrismaClient();
    const limit = Math.min(options.limit || 20, 50);

    const whereClause: any = {};
    if (options.format) {
      whereClause.format = options.format;
    }
    if (options.authorId) {
      whereClause.authorId = options.authorId;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            location: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = posts;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id || null;
    }

    // Filter blocked authors if viewer is specified
    if (options.viewerId) {
      items = await privacyService.filterBlocked(options.viewerId, items);
    }

    return {
      posts: items,
      nextCursor,
    };
  }

  /**
   * Atomic post creation with author postCount increment transaction
   */
  public async createPost(data: {
    authorId: string;
    content: string;
    image?: string;
    format?: PostFormat;
    audioDuration?: number;
    voiceWaveform?: number[];
    midnightGradient?: string;
    isAnonymous?: boolean;
    readingTime?: string;
    vibe?: string;
    tags?: string[];
  }) {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId: data.authorId,
          content: data.content,
          image: data.image,
          format: data.format || 'STANDARD',
          audioDuration: data.audioDuration,
          voiceWaveform: data.voiceWaveform || [],
          midnightGradient: data.midnightGradient,
          isAnonymous: data.isAnonymous ?? false,
          readingTime: data.readingTime,
          vibe: data.vibe,
          tags: data.tags || [],
        },
      });

      // Atomic counter increment
      await tx.user.update({
        where: { id: data.authorId },
        data: { postsCount: { increment: 1 } },
      });

      return post;
    });
  }

  /**
   * Atomic Like / Unlike toggle with race-condition safe transaction
   */
  public async toggleLike(userId: string, postId: string): Promise<{
    liked: boolean;
    likesCount: number;
  }> {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      // 1. Check existing like
      const existing = await tx.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (existing) {
        // Unlike atomically
        await tx.like.delete({
          where: { id: existing.id },
        });

        const updated = await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: { decrement: 1 },
          },
          select: { likesCount: true },
        });

        // Guard against negative counts
        const safeLikesCount = Math.max(0, updated.likesCount);
        if (updated.likesCount < 0) {
          await tx.post.update({
            where: { id: postId },
            data: { likesCount: 0 },
          });
        }

        return { liked: false, likesCount: safeLikesCount };
      } else {
        // Like atomically
        await tx.like.create({
          data: { userId, postId },
        });

        const updated = await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: { increment: 1 },
          },
          select: { likesCount: true },
        });

        return { liked: true, likesCount: updated.likesCount };
      }
    });
  }

  /**
   * Atomic Comment creation with post commentCount increment
   */
  public async addComment(data: {
    authorId: string;
    postId: string;
    content: string;
  }) {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          authorId: data.authorId,
          postId: data.postId,
          content: data.content,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      await tx.post.update({
        where: { id: data.postId },
        data: { commentsCount: { increment: 1 } },
      });

      return comment;
    });
  }

  /**
   * Atomic Post Deletion with author postCount decrement
   */
  public async deletePost(userId: string, postId: string): Promise<boolean> {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post || post.authorId !== userId) {
        return false;
      }

      await tx.post.delete({
        where: { id: postId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { postsCount: { decrement: 1 } },
      });

      return true;
    });
  }

  /**
   * Healing Utility: Reconcile derived counts in database to repair any historic inconsistency
   */
  public async reconcilePostCounts(postId: string) {
    const prisma = getPrismaClient();

    const [actualLikes, actualComments] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      prisma.comment.count({ where: { postId } }),
    ]);

    await prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: actualLikes,
        commentsCount: actualComments,
      },
    });

    return { likesCount: actualLikes, commentsCount: actualComments };
  }
}

export const postService = new PostService();
