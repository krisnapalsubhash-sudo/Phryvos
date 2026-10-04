import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; voiceNoteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, voiceNoteId } = await params;

    // Verify caller is a participant
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

    const voiceNote = await prisma.voiceNote.findUnique({
      where: { id: voiceNoteId },
    });

    if (!voiceNote || voiceNote.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Voice note not found' }, { status: 404 });
    }

    if (voiceNote.status !== 'READY') {
      return NextResponse.json({ error: 'Voice note is not available for playback' }, { status: 410 });
    }

    // Mark listened if listened by recipient
    if (voiceNote.senderId !== session.user.id && !voiceNote.isListened) {
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: { isListened: true },
      });
    }

    const audioUrl = `${process.env.NEXT_PUBLIC_CDN_URL || ''}/${voiceNote.audioKey}`;

    return NextResponse.json({
      success: true,
      playbackUrl: audioUrl,
      duration: voiceNote.duration,
      waveform: voiceNote.waveform,
      isListened: true,
      expiresAt: voiceNote.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Authorize playback error:', error);
    return NextResponse.json({ error: 'Failed to authorize voice playback' }, { status: 500 });
  }
}
