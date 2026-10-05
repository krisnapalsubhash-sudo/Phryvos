import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    }

    // Check cooldown (1 hour)
    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: session.user.email,
        token: { not: { startsWith: 'reset-' } },
      },
      orderBy: { expires: 'desc' },
    });

    if (existingToken && Date.now() - existingToken.expires.getTime() < 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Please wait 1 hour before requesting another verification email' },
        { status: 429 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: session.user.email,
        token: { not: { startsWith: 'reset-' } },
      },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: session.user.email,
        token: hashedToken,
        expires: expiresAt,
      },
    });

    // TODO: Send verification email with verificationToken in URL query
    // await sendVerificationEmail(session.user.email, verificationToken);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}