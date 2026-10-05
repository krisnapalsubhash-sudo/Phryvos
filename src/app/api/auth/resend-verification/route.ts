import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { resendVerificationSchema } from '@/lib/auth/validation';
import { safetyEngine } from '@/lib/safety/engine';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

// Cooldown tracker: email -> timestamp of last sent email (in-memory fast cache)
const resendCooldowns = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown between resends

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limiting by IP
    const ipRateLimit = safetyEngine.checkRateLimit({ userId: `resend-ip:${ip}`, clientIp: ip });
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait a moment before requesting another verification email.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // Determine target email from request body or session
    let targetEmail: string | undefined;

    try {
      const body = await request.json();
      const validation = resendVerificationSchema.safeParse(body);
      if (validation.success) {
        targetEmail = validation.data.email;
      }
    } catch {
      // Body not provided or empty, try session
    }

    if (!targetEmail) {
      const session = await auth().catch(() => null);
      if (session?.user?.email) {
        targetEmail = session.user.email.toLowerCase().trim();
      }
    }

    if (!targetEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email address is required to resend verification.',
          code: 'EMAIL_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Cooldown check per email
    const now = Date.now();
    const lastSent = resendCooldowns.get(targetEmail);
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${waitSec} seconds before requesting another email.`,
          code: 'COOLDOWN_ACTIVE',
        },
        { status: 429 }
      );
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true, username: true, email: true, emailVerified: true },
    });

    // Account enumeration protection: always return generic success even if user not found or already verified
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'If an unverified account exists with this email, a verification link has been sent.',
        code: 'REQUEST_RECEIVED',
      });
    }

    // Mark cooldown
    resendCooldowns.set(targetEmail, now);

    // Generate new token & invalidate older ones
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier: targetEmail },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: targetEmail,
          token: hashedVerificationToken,
          expires: expiresAt,
        },
      }),
    ]);

    // Send email
    try {
      await sendVerificationEmail({
        email: user.email,
        username: user.username,
        token: rawVerificationToken,
      });
    } catch (mailError) {
      console.error('[Resend Verification Email Error]:', mailError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send verification email. Please try again later.',
          code: 'EMAIL_SEND_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      code: 'SENT',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resend verification email due to a server error.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}