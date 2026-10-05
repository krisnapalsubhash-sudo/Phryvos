import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/auth/validation';
import { safetyEngine } from '@/lib/safety/engine';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = safetyEngine.checkRateLimit({ userId: `register:${ip}`, clientIp: ip });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many registration attempts. Please slow down and try again later.',
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

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, email, password } = validation.data;
    const prisma = getPrismaClient();

    // Generate high-entropy verification token (64 hex characters)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);

    let createdUser: { id: string; username: string; email: string };

    try {
      // Atomic user + verification token creation in a single transaction
      createdUser = await prisma.$transaction(async (tx) => {
        // Double-check existing inside transaction
        const existing = await tx.user.findFirst({
          where: {
            OR: [{ username }, { email }],
          },
          select: { username: true, email: true },
        });

        if (existing) {
          const isUsernameTaken = existing.username === username;
          throw new UniqueConstraintError(
            isUsernameTaken ? 'username' : 'email',
            isUsernameTaken ? 'Username is already taken' : 'An account with this email already exists'
          );
        }

        // Clean up any stale tokens for this email
        await tx.verificationToken.deleteMany({
          where: { identifier: email },
        });

        const user = await tx.user.create({
          data: {
            username,
            email,
            passwordHash,
            displayName: username,
            avatar: '😊',
            interests: [],
            emailVerified: null,
          },
          select: {
            id: true,
            username: true,
            email: true,
          },
        });

        await tx.verificationToken.create({
          data: {
            identifier: email,
            token: hashedVerificationToken,
            expires: expiresAt,
          },
        });

        return user;
      });
    } catch (txError: any) {
      // Handle known conflict error thrown from inside transaction
      if (txError instanceof UniqueConstraintError) {
        return NextResponse.json(
          {
            success: false,
            error: txError.message,
            code: txError.field === 'username' ? 'USERNAME_TAKEN' : 'EMAIL_ALREADY_EXISTS',
          },
          { status: 409 }
        );
      }

      // Handle Prisma P2002 Unique Constraint Violation code
      if (txError?.code === 'P2002') {
        const target = txError.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
        const isUsername = targetStr.includes('username');
        return NextResponse.json(
          {
            success: false,
            error: isUsername ? 'Username is already taken' : 'An account with this email already exists',
            code: isUsername ? 'USERNAME_TAKEN' : 'EMAIL_ALREADY_EXISTS',
          },
          { status: 409 }
        );
      }

      console.error('[Registration Transaction Error]:', txError);
      return NextResponse.json(
        {
          success: false,
          error: 'Registration could not be completed at this time. Please try again.',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // Send verification email
    let emailSent = false;
    try {
      const emailResult = await sendVerificationEmail({
        email: createdUser.email,
        username: createdUser.username,
        token: rawVerificationToken,
      });
      emailSent = emailResult.success;
    } catch (mailError) {
      console.error('[Registration Email Error]:', mailError);
      emailSent = false;
    }

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        emailSent,
        message: emailSent
          ? 'Account created. Please check your email to verify your account.'
          : 'Account created, but verification email could not be delivered. Please request a new verification email.',
        code: emailSent ? 'SUCCESS' : 'VERIFICATION_EMAIL_FAILED',
        user: {
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unhandled registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during registration. Please try again.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

class UniqueConstraintError extends Error {
  constructor(public readonly field: 'username' | 'email', message: string) {
    super(message);
    this.name = 'UniqueConstraintError';
  }
}