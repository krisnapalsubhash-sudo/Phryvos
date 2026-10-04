import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { realtimeEngine } from '@/lib/realtime/engine';

export const dynamic = 'force-dynamic';

function normalizeGuestId(rawId?: string | null): string | null {
  if (!rawId) return null;
  if (/^(anon|guest)[-_]/i.test(rawId)) {
    return rawId;
  }
  return `guest_${rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}`;
}

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId', code: 'MISSING_ROOM_ID', requestId },
        { status: 400 }
      );
    }

    // Determine caller identity (session user or guest)
    const session = await auth();
    let callerId = session?.user?.id;
    if (!callerId) {
      const rawUser = searchParams.get('userId');
      callerId = normalizeGuestId(rawUser) || undefined;
    }

    if (!callerId) {
      return NextResponse.json(
        { error: 'Unauthorized: Caller identity is required', code: 'UNAUTHORIZED', requestId },
        { status: 401 }
      );
    }

    // Verify caller is an actual participant of this room (active or archived)
    const isMember = realtimeEngine.isParticipant(roomId, callerId, true);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a participant in this room', code: 'FORBIDDEN_ROOM_MEMBER', requestId },
        { status: 403 }
      );
    }

    const messages = realtimeEngine.getRoomHistory(roomId);
    return NextResponse.json({ success: true, roomId, messages });
  } catch (err: any) {
    console.error(`[RealtimeHistory Error] [requestId: ${requestId}]`, err?.message || err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.', code: 'INTERNAL_SERVER_ERROR', requestId },
      { status: 500 }
    );
  }
}
