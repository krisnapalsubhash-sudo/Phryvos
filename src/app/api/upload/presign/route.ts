import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import crypto from 'crypto';

const prisma = getPrismaClient();

// Allowed file types and max sizes
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
};

const MAX_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  audio: 10 * 1024 * 1024, // 10MB
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, folder = 'posts' } = body;

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'fileName, fileType, and fileSize are required' },
        { status: 400 }
      );
    }

    // Validate file type
    let category: 'image' | 'video' | 'audio' | null = null;
    for (const [cat, types] of Object.entries(ALLOWED_TYPES)) {
      if (types.includes(fileType)) {
        category = cat as 'image' | 'video' | 'audio';
        break;
      }
    }

    if (!category) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_SIZES[category]) {
      return NextResponse.json(
        { error: `File too large. Max size for ${category}: ${MAX_SIZES[category] / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = fileName.split('.').pop() || '';
    const key = `${folder}/${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    // TODO: In production, generate presigned URL for S3/R2/Cloudflare R2
    // For now, return a mock response that the client can use for direct upload
    // Real implementation would use @aws-sdk/s3-request-presigner or similar

    const uploadUrl = `/api/upload/direct?key=${encodeURIComponent(key)}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      fields: {
        key,
        // In real implementation: policy, signature, etc.
      },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
    });
  } catch (error) {
    console.error('Presign upload error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}