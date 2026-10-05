import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/auth/validation';
import { auth } from '@/lib/auth/config';
import { safetyEngine } from '@/lib/safety/engine';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = safetyEngine.checkRateLimit({ userId: `register:${ip}`, clientIp: ip });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please slow down and try again later.' },
        { status: 429 }
      );
    }


    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, email, password } = validation.data;
    const prisma = getPrismaClient();

    // Check for existing username/email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      const field = existing.username === username ? 'username' : 'email';
      return NextResponse.json(
        { error: `${field} already in use` },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: username,
        avatar: '😊',
        interests: [],
      },
    });

    // Generate email verification token
    const verificationToken = crypto.randomUUID();
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: expiresAt,
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      success: true,
      message: 'Account created. Please verify your email.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}