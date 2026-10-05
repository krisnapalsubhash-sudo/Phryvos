import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { onboardingSchema, validateUsername } from '@/lib/auth/validation';

class UniqueConstraintError extends Error {
  constructor(public readonly field: 'username', message: string) {
    super(message);
    this.name = 'UniqueConstraintError';
  }
}

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

    // Validate that the schema-normalized username matches canonical normalization
    const clientUsername = validation.data.username;
    const normalized = validateUsername(clientUsername);
    if (!normalized.valid || !normalized.normalized) {
      return NextResponse.json(
        { error: 'Validation failed', details: { username: [normalized.error || 'Invalid username'] } },
        { status: 400 }
      );
    }

    // Sanity check: schema normalization and validateUsername should agree
    if (normalized.normalized !== clientUsername) {
      return NextResponse.json(
        { error: 'Username normalization mismatch' },
        { status: 500 }
      );
    }

    const { displayName, avatar, interests, discoverySource, presetChosen } = validation.data;
    const prisma = getPrismaClient();

    let user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string;
      interests: string[];
      emailVerified: Date | null;
      onboardingCompleted: boolean;
    };

    try {
      // Atomic transaction: check availability + apply update in one DB transaction.
      // The DB unique constraint on username is the final authority; concurrent
      // onboarding requests for the same name will serialize here, with only one
      // succeeding and the other receiving a controlled conflict response.
      user = await prisma.$transaction(async (tx) => {
        // Double-check availability inside the transaction
        const existingUser = await tx.user.findFirst({
          where: {
            username: normalized.normalized,
            NOT: { id: session.user.id },
          },
          select: { id: true },
        });

        if (existingUser) {
          throw new UniqueConstraintError('username', 'Username is already taken');
        }

        return tx.user.update({
          where: { id: session.user.id },
          data: {
            username: normalized.normalized,
            displayName: displayName || normalized.normalized,
            avatar: avatar || '😊',
            interests: interests || [],
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
      });
    } catch (txError: any) {
      // Handle known conflict error thrown from inside transaction
      if (txError instanceof UniqueConstraintError) {
        return NextResponse.json(
          { error: txError.message, code: 'USERNAME_TAKEN' },
          { status: 409 }
        );
      }

      // Handle Prisma P2002 Unique Constraint Violation code
      if (txError?.code === 'P2002') {
        const target = txError.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
        if (targetStr.includes('username')) {
          return NextResponse.json(
            { error: 'Username already taken', code: 'USERNAME_TAKEN' },
            { status: 409 }
          );
        }
      }

      console.error('Onboarding error:', txError);
      return NextResponse.json(
        { error: 'Onboarding failed' },
        { status: 500 }
      );
    }

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
