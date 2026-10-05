import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';
import { validateUsername } from '@/lib/auth/validation';
import { safetyEngine } from '@/lib/safety/engine';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = safetyEngine.checkRateLimit({ userId: `check-username:${ip}`, clientIp: ip });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          available: false,
          error: 'RATE_LIMITED',
          message: 'Too many requests. Please slow down and try again.',
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawUsername = searchParams.get('username');

    if (!rawUsername) {
      return NextResponse.json(
        {
          available: false,
          error: 'INVALID_FORMAT',
          reason: 'Username parameter is required',
        },
        { status: 400 }
      );
    }

    // Canonical validation
    const validation = validateUsername(rawUsername);
    if (!validation.valid || !validation.normalized) {
      return NextResponse.json(
        {
          available: false,
          error: 'INVALID_FORMAT',
          reason: validation.error || 'Invalid username format',
        },
        { status: 400 }
      );
    }

    const normalized = validation.normalized;
    const prisma = getPrismaClient();

    const existing = await prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        error: 'USERNAME_TAKEN',
        reason: 'Username is already taken',
      });
    }

    return NextResponse.json({
      available: true,
      username: normalized,
    });
  } catch (error) {
    console.error('Check username error:', error);
    // Never claim available on database failure
    return NextResponse.json(
      {
        available: false,
        error: 'USERNAME_CHECK_UNAVAILABLE',
        message: 'Unable to check username availability at this time. Please try again.',
      },
      { status: 503 }
    );
  }
}