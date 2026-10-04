import { env } from "@/env";
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';

// One-time admin endpoint to wipe all user data
// REMOVE THIS FILE after use!
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = getPrismaClient();

    // Delete in dependency order (child tables first)
    await prisma.message.deleteMany({});
    await prisma.conversationParticipant.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.block.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.connection.deleteMany({});
    await prisma.story.deleteMany({});
    await prisma.verificationToken.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});

    return NextResponse.json({ success: true, message: 'All user data deleted.' });
  } catch (error: any) {
    console.error('Wipe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
