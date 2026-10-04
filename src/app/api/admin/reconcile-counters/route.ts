import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/env';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${env.NEXTAUTH_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Repair User counters
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      const postsCount = await prisma.post.count({ where: { authorId: user.id } });
      const followers = await prisma.connection.count({ where: { connectedUserId: user.id } });
      const following = await prisma.connection.count({ where: { userId: user.id } });
      
      await prisma.user.update({
        where: { id: user.id },
        data: { postsCount, followers, following }
      });
    }

    // Repair Post counters
    const posts = await prisma.post.findMany({ select: { id: true } });
    for (const post of posts) {
      const likesCount = await prisma.like.count({ where: { postId: post.id } });
      const commentsCount = await prisma.comment.count({ where: { postId: post.id } });
      
      await prisma.post.update({
        where: { id: post.id },
        data: { likesCount, commentsCount }
      });
    }

    return NextResponse.json({ success: true, message: 'Counters reconciled successfully' });
  } catch (error) {
    console.error('Counter reconciliation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
