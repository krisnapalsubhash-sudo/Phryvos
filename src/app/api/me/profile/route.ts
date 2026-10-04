import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { updateProfileSchema } from '@/lib/auth/validation';

const prisma = getPrismaClient();

const USER_PUBLIC_FIELDS = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  bio: true,
  location: true,
  interests: true,
  cover: true,
  followers: true,
  following: true,
  postsCount: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
};

const USER_PRIVATE_FIELDS = {
  ...USER_PUBLIC_FIELDS,
  email: true,
  emailVerified: true,
  role: true,
  ageGroup: true,
  onboardingCompleted: true,
  demoMode: true,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: USER_PRIVATE_FIELDS,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastSeen: user.lastSeen?.toISOString() || null,
        emailVerified: user.emailVerified?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { displayName, bio, location, avatar, cover, interests, website } = validation.data;

    // Check username uniqueness if displayName is being used as username
    // (We don't allow username changes here - that's a separate flow)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName,
        bio,
        location,
        avatar,
        cover,
        interests,
        // website would need a new field in schema
      },
      select: USER_PUBLIC_FIELDS,
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastSeen: user.lastSeen?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}