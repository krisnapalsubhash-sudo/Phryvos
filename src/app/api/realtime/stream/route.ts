import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import { realtimeEngine } from '@/lib/realtime/engine';
import type { RealtimeUser, MatchPreferences } from '@/lib/realtime/types';

export const dynamic = 'force-dynamic';

function normalizeGuestId(rawId?: string | null): string {
  if (rawId && /^(anon|guest)[-_]/i.test(rawId)) {
    return rawId;
  }
  if (rawId) {
    return `guest_${rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}`;
  }
  return `anon_${Math.random().toString(36).substring(2, 9)}`;
}

function getAllowedOrigin(origin: string | null, req: NextRequest): string | null {
  if (!origin) return null;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:4000',
    'https://phryvos.in',
    'https://www.phryvos.in',
  ].filter(Boolean) as string[];

  if (
    allowedOrigins.includes(origin) ||
    origin === req.nextUrl.origin ||
    origin.endsWith('.phryvos.in')
  ) {
    return origin;
  }

  return null;
}

// Initialize privacy service caches (run once)
let privacyInitialized = false;
async function initializePrivacyCaches() {
  if (!privacyInitialized) {
    await realtimeEngine.initializeCaches();
    privacyInitialized = true;
  }
}

export async function GET(req: NextRequest) {
  await initializePrivacyCaches();

  const { searchParams } = new URL(req.url);
  const session = await auth();

  let userId: string;
  let username: string;
  let displayName: string;
  let avatar: string;
  let ageGroup: string = 'UNVERIFIED';
  let birthDate: string | undefined;
  let interests: string[] = ['Chill'];
  let languages: string[] = [];
  let gameTags: string[] = [];
  let hobbyTags: string[] = [];
  let topicTags: string[] = [];
  let location: string = 'Orbit';
  let locationDisplay: string = 'Orbit';
  let matchPreferences: MatchPreferences | undefined;

  if (session?.user?.id) {
    // 1. Authoritative Identity from Session
    userId = session.user.id;
    username = session.user.name || 'user';
    displayName = session.user.name || 'User';
    avatar = session.user.image || '😊';

    // 2. Hydrate authoritative profile from database if available
    try {
      const prisma = getPrismaClient();
      if (prisma.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            username: true,
            displayName: true,
            avatar: true,
            ageGroup: true,
            birthDate: true,
            interests: true,
            location: true,
            matchPreference: true,
          },
        });

        if (dbUser) {
          username = dbUser.username || username;
          displayName = dbUser.displayName || displayName;
          avatar = dbUser.avatar || avatar;
          if (dbUser.ageGroup) {
            ageGroup = dbUser.ageGroup;
          }
          if (dbUser.birthDate) {
            birthDate = dbUser.birthDate.toISOString();
          }
          if (dbUser.interests && dbUser.interests.length > 0) {
            interests = dbUser.interests;
          }
          if (dbUser.location) {
            location = dbUser.location;
          }

          // Hydrate match preferences
          if (dbUser.matchPreference) {
            const mp = dbUser.matchPreference;
            matchPreferences = {
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

            // Compute location display based on privacy settings
            if (matchPreferences.locationSharing && matchPreferences.locationSharing !== 'NONE') {
              if (matchPreferences.locationSharing === 'COUNTRY' && matchPreferences.country) {
                locationDisplay = matchPreferences.country;
              } else if (matchPreferences.locationSharing === 'REGION' && matchPreferences.region) {
                locationDisplay = matchPreferences.region;
              } else if (matchPreferences.locationSharing === 'CITY' && matchPreferences.city) {
                locationDisplay = matchPreferences.city;
              } else {
                locationDisplay = dbUser.location || 'Orbit';
              }
            }
          }
        }
      }
    } catch {
      // Safe fallback to session values if DB temporarily unreachable
    }
  } else {
    // 3. Unauthenticated guest session: prevent identity spoofing
    const requestedId = searchParams.get('userId');
    userId = normalizeGuestId(requestedId);
    username = (searchParams.get('username') || 'stranger').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    displayName = (searchParams.get('displayName') || 'Stranger').slice(0, 30);
    avatar = (searchParams.get('avatar') || '😊').slice(0, 200);
  }

  const user: RealtimeUser = {
    id: userId,
    username,
    displayName,
    avatar,
    location,
    locationDisplay,
    interests,
    languages,
    gameTags,
    hobbyTags,
    topicTags,
    ageGroup,
    birthDate,
    matchPreferences: matchPreferences ?? {
      interests: interests,
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
  };

  // Safe multi-connection tracking per account
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const stream = new ReadableStream({
    start(controller) {
      realtimeEngine.registerClient(userId, connectionId, user, controller);

      // Send initial connection event
      const initialPayload = `event: presence_sync\ndata: ${JSON.stringify({
        status: 'connected',
        userId,
        connectionId,
        onlineCount: realtimeEngine.getOnlineCount(),
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialPayload));

      // Keepalive ping every 15s to keep tunnel and proxies alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
          realtimeEngine.updateHeartbeat(userId, connectionId);
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      // Clean up when client disconnects or aborts
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        realtimeEngine.unregisterClient(userId, connectionId);
      });
    },
    cancel() {
      if (userId) {
        realtimeEngine.unregisterClient(userId, connectionId);
      }
    },
  });

  // Security Headers: Remove wildcard CORS and apply origin validation
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform, no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
  };

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin, req);
  if (allowedOrigin) {
    responseHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
    responseHeaders['Access-Control-Allow-Credentials'] = 'true';
    responseHeaders['Access-Control-Allow-Headers'] = 'Cache-Control, Content-Type';
  }

  return new Response(stream, { headers: responseHeaders });
}