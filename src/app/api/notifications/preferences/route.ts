import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification preferences from user model or separate table
    // For now, return defaults - in production, store in User model or separate table
    return NextResponse.json({
      success: true,
      preferences: {
        pushEnabled: true,
        emailEnabled: false,
        showPreview: true, // Show message preview on lock screen
        types: {
          likes: true,
          comments: true,
          follows: true,
          messageRequests: true,
          mentions: true,
          system: true,
        },
      },
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
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
    // In production, store preferences in User model or separate NotificationPreference table
    // For now, just return success

    return NextResponse.json({
      success: true,
      preferences: body,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}