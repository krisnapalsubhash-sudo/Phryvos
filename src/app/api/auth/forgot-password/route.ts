import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';
import { forgotPasswordSchema } from '@/lib/auth/validation';
import { safetyEngine } from '@/lib/safety/engine';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Rate limiting: prevent spamming password reset requests
    const rateLimit = safetyEngine.checkRateLimit(`pw-reset:${email}`, undefined, ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset link has been sent',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomUUID();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        token: { startsWith: 'reset-' },
      },
    });

    // Store hashed token in database (never plain text)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: `reset-${hashedToken}`,
        expires: expiresAt,
      },
    });

    // TODO: Send password reset email with the raw resetToken in URL
    // await sendResetEmail(email, resetToken);

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}