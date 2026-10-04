import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify user is a conversation participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const voiceNotes = await prisma.voiceNote.findMany({
      where: {
        conversationId,
        status: { not: 'FAILED' },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      voiceNotes: voiceNotes.map((vn) => ({
        id: vn.id,
        senderId: vn.senderId,
        sender: vn.sender,
        audioKey: vn.audioKey,
        duration: vn.duration,
        waveform: vn.waveform,
        status: vn.status,
        mimeType: vn.mimeType,
        isListened: vn.isListened,
        expiresAt: vn.expiresAt.toISOString(),
        createdAt: vn.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Fetch voice notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch voice notes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify sender is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden: You are not a participant' }, { status: 403 });
    }

    const body = await request.json();
    const { audioKey, duration, waveform = [], mimeType = 'audio/webm', size = 0 } = body;

    // Validate audioKey ownership and path
    if (!audioKey || typeof audioKey !== 'string') {
      return NextResponse.json({ error: 'audioKey is required' }, { status: 400 });
    }

    const expectedPrefix = `voice/${session.user.id}/`;
    if (!audioKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Invalid audio storage key or unauthorized ownership' }, { status: 403 });
    }

    // Validate duration: 1 sec to 5 mins
    const durNum = Math.floor(Number(duration));
    if (isNaN(durNum) || durNum < 1 || durNum > 300) {
      return NextResponse.json({ error: 'Voice note duration must be between 1 and 300 seconds' }, { status: 400 });
    }

    // Validate MIME
    const allowedMimes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'];
    if (!allowedMimes.includes(mimeType)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
    }

    // 7-day retention expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const voiceNote = await prisma.voiceNote.create({
      data: {
        conversationId,
        senderId: session.user.id,
        audioKey,
        duration: durNum,
        waveform: Array.isArray(waveform) ? waveform.slice(0, 100).map(Number) : [],
        mimeType,
        size: Math.min(Math.max(0, Number(size) || 0), 20 * 1024 * 1024),
        status: 'READY',
        expiresAt,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      voiceNote: {
        id: voiceNote.id,
        audioKey: voiceNote.audioKey,
        duration: voiceNote.duration,
        waveform: voiceNote.waveform,
        status: voiceNote.status,
        expiresAt: voiceNote.expiresAt.toISOString(),
        createdAt: voiceNote.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create voice note error:', error);
    return NextResponse.json({ error: 'Failed to create voice note' }, { status: 500 });
  }
}
