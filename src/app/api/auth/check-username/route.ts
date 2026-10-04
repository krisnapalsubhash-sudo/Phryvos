import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, reason: 'Too short' });
    }

    // Validate format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
      return NextResponse.json({ available: false, reason: 'Invalid format' });
    }

    const prisma = getPrismaClient();
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Check username error:', error);
    // On error, don't block the user — treat as available so they can proceed to registration
    return NextResponse.json({ available: true, reason: 'Could not verify, proceed anyway' });
  }
}