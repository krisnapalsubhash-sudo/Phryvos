import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, fileName, fileType, fileSize, folder = 'posts' } = body;

    if (!key || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'key, fileName, and fileType are required' },
        { status: 400 }
      );
    }

    // Verify the key belongs to this user
    if (!key.startsWith(`${folder}/${session.user.id}/`)) {
      return NextResponse.json({ error: 'Invalid upload key' }, { status: 403 });
    }

    // In production, verify file was actually uploaded to S3/R2
    // For now, create a media record
    const media = await prisma.media.create({
      data: {
        userId: session.user.id,
        key,
        fileName,
        fileType,
        fileSize,
        folder,
        // TODO: Add processing status, thumbnails, etc.
      },
    });

    // Construct public URL (in production, use CDN domain)
    const publicUrl = `${process.env.NEXT_PUBLIC_CDN_URL || ''}/${key}`;

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: publicUrl,
        key: media.key,
        fileName: media.fileName,
        fileType: media.fileType,
        fileSize: media.fileSize,
        createdAt: media.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Complete upload error:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}