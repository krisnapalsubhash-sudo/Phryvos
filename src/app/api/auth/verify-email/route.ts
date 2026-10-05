import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';
import { verifyEmailSchema } from '@/lib/auth/validation';
import { safetyEngine } from '@/lib/safety/engine';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = safetyEngine.checkRateLimit({ userId: `verify-email:${ip}`, clientIp: ip });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification attempts. Please wait before trying again.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing verification token',
          code: 'INVALID_TOKEN',
        },
        { status: 400 }
      );
    }

    const { token: rawToken } = validation.data;
    const prisma = getPrismaClient();

    // Look up token by SHA-256 hash
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    let record = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    // Fallback for legacy unhashed tokens
    if (!record) {
      record = await prisma.verificationToken.findUnique({
        where: { token: rawToken },
      });
    }

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification link or the link has already been used.',
          code: 'INVALID_TOKEN',
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (record.expires < new Date()) {
      // Invalidate expired token
      try {
        await prisma.verificationToken.delete({
          where: { token: record.token },
        });
      } catch {
        // ignore if already deleted
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Verification link has expired. Please request a new one.',
          code: 'TOKEN_EXPIRED',
        },
        { status: 400 }
      );
    }

    const email = record.identifier;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No account associated with this verification token.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // If user is already verified (idempotency)
    if (user.emailVerified) {
      // Clean up token
      try {
        await prisma.verificationToken.delete({
          where: { token: record.token },
        });
      } catch {
        // ignore if already deleted
      }

      return NextResponse.json({
        success: true,
        message: 'Email is already verified. You can now sign in.',
        code: 'ALREADY_VERIFIED',
      });
    }

    // Atomic: mark user verified and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token: record.token },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
      code: 'VERIFIED_SUCCESS',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify email due to a server error. Please try again.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}