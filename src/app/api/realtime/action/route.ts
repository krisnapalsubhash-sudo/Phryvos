import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { realtimeEngine } from '@/lib/realtime/engine';
import { safetyEngine } from '@/lib/safety/engine';
import { connectionService } from '@/lib/services/connectionService';
import { notificationService } from '@/lib/services/notificationService';
import { getPrismaClient } from '@/lib/db/prisma';
import type { RealtimeUser, MatchPreferences } from '@/lib/realtime/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Maximum payload size: 64 KB
const MAX_PAYLOAD_BYTES = 65536;

// Helper to normalize anonymous / guest IDs consistently
function normalizeGuestId(rawId?: string): string {
  if (rawId && /^(anon|guest)[-_]/i.test(rawId)) {
    return rawId;
  }
  if (rawId) {
    return `guest_${rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}`;
  }
  return `anon_${Math.random().toString(36).substring(2, 9)}`;
}

// Zod schemas for input validation
const UserMetaInputSchema = z
  .object({
    id: z.string().max(128).optional(),
    username: z.string().max(64).optional(),
    displayName: z.string().max(64).optional(),
    avatar: z.string().max(256).optional(),
    location: z.string().max(64).optional(),
    interests: z.array(z.string().max(32)).max(20).optional(),
    vibe: z.string().max(64).optional(),
    ageGroup: z.string().max(32).optional(),
    languages: z.array(z.string().max(32)).max(10).optional(),
    gameTags: z.array(z.string().max(32)).max(10).optional(),
    hobbyTags: z.array(z.string().max(32)).max(10).optional(),
    topicTags: z.array(z.string().max(32)).max(10).optional(),
    birthDate: z.string().optional(),
  })
  .optional();

const RealtimeActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('join_queue'),
    userId: z.string().max(128).optional(),
    userMeta: UserMetaInputSchema,
  }),
  z.object({
    action: z.literal('leave_queue'),
    userId: z.string().max(128).optional(),
  }),
  z.object({
    action: z.literal('send_message'),
    userId: z.string().max(128).optional(),
    roomId: z.string().min(1, 'Room ID is required').max(128),
    userMeta: UserMetaInputSchema,
    text: z.string().min(1, 'Message text cannot be empty').max(1000, 'Message text exceeds 1000 characters'),
    type: z.enum(['text', 'image', 'voice']).optional(),
  }),
  z.object({
    action: z.literal('typing'),
    userId: z.string().max(128).optional(),
    roomId: z.string().min(1, 'Room ID is required').max(128),
    isTyping: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('skip_room'),
    userId: z.string().max(128).optional(),
    roomId: z.string().min(1, 'Room ID is required').max(128),
  }),
  z.object({
    action: z.literal('send_friend_request'),
    userId: z.string().max(128).optional(),
    roomId: z.string().min(1, 'Room ID is required').max(128),
    userMeta: UserMetaInputSchema,
  }),
  z.object({
    action: z.literal('accept_friend_request'),
    userId: z.string().max(128).optional(),
    roomId: z.string().min(1, 'Room ID is required').max(128),
    userMeta: UserMetaInputSchema,
  }),
  z.object({
    action: z.literal('block_user'),
    userId: z.string().max(128).optional(),
    targetUserId: z.string().min(1, 'targetUserId is required').max(128),
    roomId: z.string().max(128).optional(),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('report_user'),
    userId: z.string().max(128).optional(),
    targetUserId: z.string().min(1, 'targetUserId is required').max(128),
    roomId: z.string().max(128).optional(),
    reason: z.string().max(500).optional(),
    category: z.string().max(100).optional(),
  }),
]);

// Build enriched RealtimeUser from session + DB preferences
async function buildRealtimeUser(session: any, bodyMeta: any): Promise<RealtimeUser> {
  const userId = session.user.id;

  // Fetch user profile with match preferences from DB
  const prisma = getPrismaClient();
  let dbUser: any = null;
  let matchPrefs: MatchPreferences | null = null;

  const prismaAny: any = prisma;
  if (prismaAny.user) {
    dbUser = await prismaAny.user.findUnique({
      where: { id: userId },
      include: { matchPreference: true },
    });

    if (dbUser?.matchPreference) {
      const mp = dbUser.matchPreference;
      matchPrefs = {
        interests: mp.interests,
        languages: mp.languages,
        ageGroupPref: mp.ageGroupPref as any,
        minAge: mp.minAge ?? undefined,
        maxAge: mp.maxAge ?? undefined,
        gameTags: mp.gameTags,
        hobbyTags: mp.hobbyTags,
        topicTags: mp.topicTags,
        locationSharing: mp.locationSharing as any,
        country: mp.country ?? undefined,
        region: mp.region ?? undefined,
        city: mp.city ?? undefined,
        enableInterestMatch: mp.enableInterestMatch,
        minInterestOverlap: mp.minInterestOverlap,
        allowSkipRematch: mp.allowSkipRematch,
      };
    }
  }

  // Compute location display based on privacy settings
  let locationDisplay = 'Orbit';
  if (matchPrefs?.locationSharing && matchPrefs.locationSharing !== 'NONE') {
    if (matchPrefs.locationSharing === 'COUNTRY' && matchPrefs.country) {
      locationDisplay = matchPrefs.country;
    } else if (matchPrefs.locationSharing === 'REGION' && matchPrefs.region) {
      locationDisplay = matchPrefs.region;
    } else if (matchPrefs.locationSharing === 'CITY' && matchPrefs.city) {
      locationDisplay = matchPrefs.city;
    } else if (dbUser?.location) {
      // Fallback to profile location if no explicit privacy location set
      locationDisplay = dbUser.location;
    }
  }

  return {
    id: userId,
    username: session.user.name || 'user',
    displayName: session.user.name || 'User',
    avatar: session.user.image || '😊',
    location: bodyMeta?.location?.slice(0, 50) || dbUser?.location || 'Orbit',
    interests: Array.isArray(bodyMeta?.interests) ? bodyMeta.interests.slice(0, 10) : (dbUser?.interests || ['Chill']),
    vibe: bodyMeta?.vibe?.slice(0, 30) || 'Friendly',
    ageGroup: (session.user as any)?.ageGroup || dbUser?.ageGroup || (bodyMeta?.ageGroup as any) || 'UNVERIFIED',
    birthDate: dbUser?.birthDate?.toISOString() || bodyMeta?.birthDate,
    matchPreferences: matchPrefs ?? {
      interests: dbUser?.interests || [],
      languages: [],
      ageGroupPref: 'SAME',
      gameTags: [],
      hobbyTags: [],
      topicTags: [],
      locationSharing: 'NONE',
      enableInterestMatch: true,
      minInterestOverlap: 1,
      allowSkipRematch: false,
    },
    locationDisplay,
    languages: bodyMeta?.languages || [],
    gameTags: bodyMeta?.gameTags || [],
    hobbyTags: bodyMeta?.hobbyTags || [],
    topicTags: bodyMeta?.topicTags || [],
  };
}

// Build RealtimeUser for anonymous/guest users
function buildGuestUser(bodyMeta: any, requestedId?: string): RealtimeUser {
  const userId = normalizeGuestId(requestedId);

  return {
    id: userId,
    username: bodyMeta?.username?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'stranger',
    displayName: bodyMeta?.displayName?.slice(0, 30) || 'Stranger',
    avatar: bodyMeta?.avatar?.slice(0, 200) || '😊',
    location: bodyMeta?.location?.slice(0, 50) || 'Orbit',
    interests: Array.isArray(bodyMeta?.interests) ? bodyMeta.interests.slice(0, 10) : ['Chill'],
    vibe: bodyMeta?.vibe?.slice(0, 30) || 'Friendly',
    ageGroup: bodyMeta?.ageGroup || 'UNVERIFIED',
    matchPreferences: {
      interests: bodyMeta?.interests || [],
      languages: bodyMeta?.languages || [],
      ageGroupPref: 'SAME',
      gameTags: bodyMeta?.gameTags || [],
      hobbyTags: bodyMeta?.hobbyTags || [],
      topicTags: bodyMeta?.topicTags || [],
      locationSharing: 'NONE',
      enableInterestMatch: true,
      minInterestOverlap: 1,
      allowSkipRematch: false,
    },
    locationDisplay: 'Orbit',
    languages: bodyMeta?.languages || [],
    gameTags: bodyMeta?.gameTags || [],
    hobbyTags: bodyMeta?.hobbyTags || [],
    topicTags: bodyMeta?.topicTags || [],
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // 1. Enforce payload size limit
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Payload too large. Maximum size is 64KB.', code: 'PAYLOAD_TOO_LARGE', requestId },
      { status: 413 }
    );
  }

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Malformed JSON payload.', code: 'BAD_REQUEST', requestId },
      { status: 400 }
    );
  }

  // 2. Validate payload schema with Zod
  const parseResult = RealtimeActionSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return NextResponse.json(
      { error: `Validation error: ${errorDetails}`, code: 'VALIDATION_FAILED', requestId },
      { status: 400 }
    );
  }

  const body = parseResult.data;

  try {
    // 3. Authoritative Session Identity Verification
    // Never trust client-supplied userId/userMeta for authenticated sessions
    const session = await auth();

    let actingUserId: string;
    let actingUserMeta: RealtimeUser;

    if (session?.user?.id) {
      actingUserId = session.user.id;
      actingUserMeta = await buildRealtimeUser(session, (body as any).userMeta);
    } else {
      // Anonymous guest session (Stranger Radar support)
      // Unauthenticated callers cannot claim real database IDs; normalize to guest/anon prefix
      const requestedId = (body as any).userId || (body as any).userMeta?.id;
      actingUserId = normalizeGuestId(requestedId);
      actingUserMeta = buildGuestUser((body as any).userMeta, requestedId);
    }

    // 4. Room Membership Verification
    // Enforce that caller is a verified participant for all room-scoped actions
    const roomScopedActions = [
      'send_message',
      'typing',
      'skip_room',
      'send_friend_request',
      'accept_friend_request',
    ];

    if ('roomId' in body && body.roomId && roomScopedActions.includes(body.action)) {
      const room = realtimeEngine.getRoom(body.roomId);
      if (!room) {
        return NextResponse.json(
          { error: 'Room not found or expired', code: 'ROOM_NOT_FOUND', requestId },
          { status: 404 }
        );
      }

      const isMember = realtimeEngine.isParticipant(body.roomId, actingUserId);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Forbidden: You are not an active participant in this room', code: 'FORBIDDEN_ROOM_MEMBER', requestId },
          { status: 403 }
        );
      }
    }

    // Client IP for rate-limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded
      ? forwarded.split(',')[0].trim()
      : req.headers.get('cf-connecting-ip') || '127.0.0.1';

    // 5. Action Dispatch
    switch (body.action) {
      case 'join_queue': {
        const matchResult = await realtimeEngine.addToQueue(actingUserMeta);
        return NextResponse.json({ success: true, matchResult, userId: actingUserId });
      }

      case 'leave_queue': {
        realtimeEngine.removeFromQueue(actingUserId);
        return NextResponse.json({ success: true });
      }

      case 'send_message': {
        const { roomId, text, type } = body;
        const result = realtimeEngine.sendMessage(
          roomId,
          actingUserMeta,
          text.trim(),
          type || 'text',
          clientIp
        );

        if (!result.success) {
          const retryAfterSec = Math.ceil((result.retryAfterMs || 1000) / 1000);
          return NextResponse.json(
            { error: result.error, retryAfterMs: result.retryAfterMs, code: 'RATE_LIMITED', requestId },
            {
              status: result.retryAfterMs ? 429 : 400,
              headers: result.retryAfterMs ? { 'Retry-After': String(retryAfterSec) } : undefined,
            }
          );
        }

        return NextResponse.json({ success: true, message: result.message });
      }

      case 'typing': {
        const { roomId, isTyping } = body;
        realtimeEngine.sendTyping(roomId, actingUserId, !!isTyping);
        return NextResponse.json({ success: true });
      }

      case 'skip_room': {
        const { roomId } = body;
        await realtimeEngine.leaveRoom(roomId, actingUserId, 'skipped');
        return NextResponse.json({ success: true });
      }

      case 'send_friend_request': {
        const { roomId } = body;
        const partner = realtimeEngine.getRoomPartner(roomId, actingUserId);
        if (!partner) {
          return NextResponse.json(
            { error: 'No partner found in this room', code: 'PARTNER_NOT_FOUND', requestId },
            { status: 400 }
          );
        }

        realtimeEngine.sendFriendRequest(roomId, actingUserMeta);
        return NextResponse.json({ success: true, message: 'Friend request sent' });
      }

      case 'accept_friend_request': {
        const { roomId } = body;
        const partner = realtimeEngine.getRoomPartner(roomId, actingUserId);
        if (!partner) {
          return NextResponse.json(
            { error: 'No partner found in this room', code: 'PARTNER_NOT_FOUND', requestId },
            { status: 400 }
          );
        }

        realtimeEngine.acceptFriendRequest(roomId, actingUserMeta);

        // If both users are registered database accounts, persist mutual connection & notification
        const isCallerGuest = /^(anon|guest)[-_]/i.test(actingUserId);
        const isPartnerGuest = /^(anon|guest)[-_]/i.test(partner.id);

        if (!isCallerGuest && !isPartnerGuest) {
          try {
            await connectionService.connectUsers(actingUserId, partner.id);
            await connectionService.connectUsers(partner.id, actingUserId);

            await notificationService.createNotification({
              userId: partner.id,
              actorId: actingUserId,
              type: 'CONNECTION_ACCEPTED',
              title: 'Connection Accepted',
              body: `${actingUserMeta.displayName || 'Someone'} accepted your friend request!`,
              metadata: { roomId },
            });
          } catch (dbErr) {
            console.warn(`[${requestId}] Connection persistence deferred:`, (dbErr as any)?.message);
          }
        }

        return NextResponse.json({ success: true, message: 'Friend request accepted' });
      }

      case 'block_user': {
        const { targetUserId, roomId } = body;
        // Prevent self-block
        if (targetUserId === actingUserId) {
          return NextResponse.json(
            { error: 'Cannot block yourself', code: 'SELF_BLOCK_FORBIDDEN', requestId },
            { status: 400 }
          );
        }

        safetyEngine.blockUser(actingUserId, targetUserId);

        if (roomId && realtimeEngine.isParticipant(roomId, actingUserId)) {
          await realtimeEngine.leaveRoom(roomId, actingUserId, 'blocked');
        }

        return NextResponse.json({ success: true, message: 'User blocked' });
      }

      case 'report_user': {
        const { targetUserId, roomId, reason, category } = body;
        // Prevent self-report
        if (targetUserId === actingUserId) {
          return NextResponse.json(
            { error: 'Cannot report yourself', code: 'SELF_REPORT_FORBIDDEN', requestId },
            { status: 400 }
          );
        }

        let evidenceContext = '';
        if (roomId) {
          const history = realtimeEngine.getRoomHistory(roomId);
          if (history.length > 0) {
            evidenceContext = history
              .slice(-10)
              .map((m) => `${m.senderName} (${m.senderId}): ${m.text}`)
              .join('\n');
          }
        }

        const incident = safetyEngine.reportUser(
          actingUserId,
          targetUserId,
          reason || 'Inappropriate behavior',
          {
            category: category || 'radar_violation',
            evidenceContext,
          }
        );

        if (roomId && realtimeEngine.isParticipant(roomId, actingUserId)) {
          await realtimeEngine.leaveRoom(roomId, actingUserId, 'reported');
        }

        return NextResponse.json({
          success: true,
          message: 'Report submitted and queued for moderation review',
          incidentId: incident.id,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION', requestId },
          { status: 400 }
        );
    }
  } catch (err: any) {
    // Redact internal error details from response; log securely server-side
    console.error(`[RealtimeAction Error] [requestId: ${requestId}]`, err?.message || err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', code: 'INTERNAL_SERVER_ERROR', requestId },
      { status: 500 }
    );
  }
}