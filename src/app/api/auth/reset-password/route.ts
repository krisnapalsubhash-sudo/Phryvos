import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { resetPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    const prisma = getPrismaClient();

    // Look up token by SHA-256 hash (with legacy plain fallback)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    let verificationToken = await prisma.verificationToken.findUnique({
      where: { token: `reset-${hashedToken}` },
    });

    if (!verificationToken) {
      verificationToken = await prisma.verificationToken.findUnique({
        where: { token: `reset-${token}` },
      });
    }

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const email = verificationToken.identifier;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password, invalidate all active sessions, and delete reset tokens atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      // Invalidate existing sessions after password reset
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
      prisma.verificationToken.deleteMany({
        where: {
          identifier: email,
          token: { startsWith: 'reset-' },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset. You can now sign in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}