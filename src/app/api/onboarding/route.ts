import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { onboardingSchema } from '@/lib/auth/validation';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, displayName, avatar, interests, discoverySource, presetChosen } = validation.data;
    const prisma = getPrismaClient();

    // Check username availability
    const existingUser = await prisma.user.findFirst({
      where: {
        username: validation.data.username,
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Update user with onboarding data - strictly preserve authentication state
    // Onboarding must NEVER modify emailVerified or authentication credentials
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: validation.data.username,
        displayName: validation.data.displayName || validation.data.username,
        avatar: validation.data.avatar || '😊',
        interests: validation.data.interests || [],
        onboardingCompleted: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        interests: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        interests: user.interests,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username already taken', code: 'USERNAME_TAKEN' },
        { status: 409 }
      );
    }
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Onboarding failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        interests: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}