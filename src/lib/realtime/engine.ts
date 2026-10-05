import type {
  RealtimeUser,
  RealtimeMessage,
  RealtimeRoom,
  RealtimeEventType,
} from './types';
import { safetyEngine } from '@/lib/safety/engine';
import { privacyService, type MatchScoreResult } from '@/lib/safety/privacyService';
import { redis, isRedisConfigured } from '@/lib/redis/client';

interface ClientConnection {
  userId: string;
  connectionId: string;
  user: RealtimeUser;
  controller: ReadableStreamDefaultController;
  connectedAt: number;
  lastPingAt: number;
}

interface MatchQueueEntry {
  userId: string;
  user: RealtimeUser;
  joinedAt: number;
}

export type RoomLifecycleStatus = 'MATCHED' | 'ACTIVE' | 'SKIPPED' | 'DISCONNECTED' | 'CLOSED';

export interface EnhancedRealtimeRoom extends RealtimeRoom {
  status: RoomLifecycleStatus;
  updatedAt: string;
}

export class RealtimeServerEngine {
  private clients: Map<string, ClientConnection> = new Map();
  private matchQueue: MatchQueueEntry[] = [];
  private activeRooms: Map<string, EnhancedRealtimeRoom> = new Map();
  private archivedRooms: Map<string, EnhancedRealtimeRoom> = new Map();
  private idempotencyCache: Map<string, { message: RealtimeMessage; timestamp: number }> = new Map();

  // Register client SSE stream with connectionId guard (supports both 3-arg test/legacy calls and 4-arg guarded calls)
  public registerClient(userId: string, user: RealtimeUser, controller: ReadableStreamDefaultController): void;
  public registerClient(userId: string, connectionId: string, user: RealtimeUser, controller: ReadableStreamDefaultController): void;
  public registerClient(
    userId: string,
    arg2: string | RealtimeUser,
    arg3: RealtimeUser | ReadableStreamDefaultController,
    arg4?: ReadableStreamDefaultController
  ) {
    let connectionId: string;
    let user: RealtimeUser;
    let controller: ReadableStreamDefaultController;

    if (typeof arg2 === 'string') {
      connectionId = arg2;
      user = arg3 as RealtimeUser;
      controller = arg4 as ReadableStreamDefaultController;
    } else {
      connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      user = arg2 as RealtimeUser;
      controller = arg3 as ReadableStreamDefaultController;
    }

    this.clients.set(userId, {
      userId,
      connectionId,
      user,
      controller,
      connectedAt: Date.now(),
      lastPingAt: Date.now(),
    });

    this.broadcastPresence();
  }

  // Remove client SSE stream ONLY if matching connectionId is still active
  public unregisterClient(userId: string, connectionId?: string) {
    const existing = this.clients.get(userId);
    if (!existing) return;

    // Guard against race conditions when a newer tab/connection has replaced this one
    if (connectionId && existing.connectionId !== connectionId) {
      return;
    }

    this.clients.delete(userId);
    this.removeFromQueue(userId);

    // If in an active room, handle clean state machine transition
    for (const [roomId, room] of this.activeRooms.entries()) {
      if (room.participants.some((p) => p.id === userId)) {
        if (room.status !== 'CLOSED' && room.status !== 'SKIPPED') {
          room.status = 'DISCONNECTED';
          room.updatedAt = new Date().toISOString();
          
          this.emitToRoom(roomId, 'stranger_left', {
            roomId,
            userId,
            reason: 'disconnected',
            message: 'Stranger disconnected from orbit',
          });

          this.archiveRoom(room);
          this.activeRooms.delete(roomId);
        }
      }
    }

    this.broadcastPresence();
  }

  // Update ping timestamp
  public updateHeartbeat(userId: string, connectionId?: string) {
    const client = this.clients.get(userId);
    if (client && (!connectionId || client.connectionId === connectionId)) {
      client.lastPingAt = Date.now();
    }
  }

  // Archive finished rooms for history sync (max 200 rooms in memory)
  private archiveRoom(room: EnhancedRealtimeRoom) {
    if (this.archivedRooms.size > 200) {
      const oldestKey = this.archivedRooms.keys().next().value;
      if (oldestKey) this.archivedRooms.delete(oldestKey);
    }
    this.archivedRooms.set(room.id, room);
  }

  // Retrieve active room
  public getRoom(roomId: string): EnhancedRealtimeRoom | undefined {
    return this.activeRooms.get(roomId);
  }

  // Retrieve active or archived room
  public getAnyRoom(roomId: string): EnhancedRealtimeRoom | undefined {
    return this.activeRooms.get(roomId) || this.archivedRooms.get(roomId);
  }

  // Check if user is a participant in room
  public isParticipant(roomId: string, userId: string, includeArchived: boolean = false): boolean {
    const room = includeArchived ? this.getAnyRoom(roomId) : this.activeRooms.get(roomId);
    if (!room) return false;
    return room.participants.some((p) => p.id === userId);
  }

  // Get partner participant in room
  public getRoomPartner(roomId: string, userId: string): RealtimeUser | undefined {
    const room = this.activeRooms.get(roomId) || this.archivedRooms.get(roomId);
    if (!room) return undefined;
    return room.participants.find((p) => p.id !== userId);
  }

  // Retrieve room history for reconnect sync
  public getRoomHistory(roomId: string): RealtimeMessage[] {
    const active = this.activeRooms.get(roomId);
    if (active) return active.messages;

    const archived = this.archivedRooms.get(roomId);
    if (archived) return archived.messages;

    return [];
  }

  // Send SSE event to a specific user (delivers locally and optionally fans out via Redis)
  public emitToUser(userId: string, event: RealtimeEventType, data: any, publishRedis: boolean = true) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        client.controller.enqueue(new TextEncoder().encode(payload));
      } catch {
        this.unregisterClient(userId, client.connectionId);
      }
    }

    if (publishRedis && isRedisConfigured()) {
      redis.publish('phryvos:realtime:events', JSON.stringify({ userId, event, data })).catch(() => {});
    }
  }

  // Send SSE event to all participants in a room
  public emitToRoom(roomId: string, event: RealtimeEventType, data: any, excludeUserId?: string) {
    const room = this.activeRooms.get(roomId) || this.archivedRooms.get(roomId);
    if (!room) return;

    for (const participant of room.participants) {
      if (excludeUserId && participant.id === excludeUserId) continue;
      this.emitToUser(participant.id, event, data);
    }
  }

  // Broadcast true presence count to all online clients (no arbitrary minimums)
  public broadcastPresence() {
    const activeCount = this.clients.size;
    const queueCount = this.matchQueue.length;

    const data = {
      onlineCount: activeCount,
      queueCount,
      timestamp: new Date().toISOString(),
    };

    for (const client of this.clients.values()) {
      try {
        const payload = `event: presence_sync\ndata: ${JSON.stringify(data)}\n\n`;
        client.controller.enqueue(new TextEncoder().encode(payload));
      } catch {}
    }
  }

  // Matchmaking Queue with scored matching and idempotency
  public async addToQueue(user: RealtimeUser) {
    // 1. Prevent duplicate queue entries
    this.removeFromQueue(user.id);

    // 2. If user is already in an active room, close the previous room cleanly
    for (const [roomId, room] of this.activeRooms.entries()) {
      if (room.participants.some((p) => p.id === user.id)) {
        this.leaveRoom(roomId, user.id);
      }
    }

    // 3. Score all candidates in the queue using centralized Privacy & Matching policy
    const scoredCandidates: Array<{ entry: MatchQueueEntry; scoreResult: MatchScoreResult }> = [];

    for (const entry of this.matchQueue) {
      if (entry.userId === user.id) continue;

      // Use the new async canDiscoverInRadar which returns score
      const scoreResult = await privacyService.canDiscoverInRadar(user, entry.user);

      if (scoreResult.allowed) {
        scoredCandidates.push({ entry, scoreResult });
      }
    }

    // 4. Sort by score descending (best match first)
    scoredCandidates.sort((a, b) => b.scoreResult.score - a.scoreResult.score);

    if (scoredCandidates.length > 0) {
      // Pick the highest-scored match
      const bestMatch = scoredCandidates[0];

      // Remove from queue (atomic)
      this.matchQueue = this.matchQueue.filter(e => e.userId !== bestMatch.entry.userId);

      const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const newRoom: EnhancedRealtimeRoom = {
        id: roomId,
        participants: [bestMatch.entry.user, user],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'MATCHED',
        messages: [],
      };

      this.activeRooms.set(roomId, newRoom);

      // Emit match_found to both users with match reasons
      this.emitToUser(user.id, 'match_found', {
        roomId,
        partner: bestMatch.entry.user,
        role: 'initiator',
        matchScore: bestMatch.scoreResult.score,
        matchReasons: bestMatch.scoreResult.reasons,
      });

      this.emitToUser(bestMatch.entry.userId, 'match_found', {
        roomId,
        partner: user,
        role: 'receiver',
        matchScore: bestMatch.scoreResult.score,
        matchReasons: bestMatch.scoreResult.reasons,
      });

      this.broadcastPresence();
      return { matched: true, roomId, partner: bestMatch.entry.user, matchScore: bestMatch.scoreResult.score, matchReasons: bestMatch.scoreResult.reasons };
    } else {
      // No match yet, enqueue
      this.matchQueue.push({
        userId: user.id,
        user,
        joinedAt: Date.now(),
      });

      this.emitToUser(user.id, 'queue_joined', {
        position: this.matchQueue.length,
      });

      this.broadcastPresence();
      return { matched: false };
    }
  }

  public removeFromQueue(userId: string) {
    const initialLen = this.matchQueue.length;
    this.matchQueue = this.matchQueue.filter((entry) => entry.userId !== userId);
    if (this.matchQueue.length !== initialLen) {
      this.broadcastPresence();
    }
  }

  // Room Message with delivery acknowledgement and persistence
  public sendMessage(
    roomId: string,
    sender: RealtimeUser,
    text: string,
    type: 'text' | 'image' | 'voice' = 'text',
    clientIp?: string,
    idempotencyKey?: string
  ): {
    success: boolean;
    message?: RealtimeMessage;
    error?: string;
    retryAfterMs?: number;
    id?: string;
    roomId?: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    text?: string;
    type?: 'text' | 'image' | 'voice';
    timestamp?: string;
    status?: 'sending' | 'delivered' | 'failed';
  } {
    const room = this.activeRooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Orbit closed or room not found' };
    }

    // Idempotency verification: deduplicate retried messages within same room and sender scope
    if (idempotencyKey) {
      const scopeKey = `${roomId}:${sender.id}:${idempotencyKey}`;
      const cached = this.idempotencyCache.get(scopeKey);
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return {
          success: true,
          message: cached.message,
          id: cached.message.id,
          roomId: cached.message.roomId,
          senderId: cached.message.senderId,
          senderName: cached.message.senderName,
          senderAvatar: cached.message.senderAvatar,
          text: cached.message.text,
          type: cached.message.type,
          timestamp: cached.message.timestamp,
          status: cached.message.status,
        };
      }
    }

    // Server-side multi-dimensional rate limit check
    const rateCheck = safetyEngine.checkRateLimit({
      userId: sender.id,
      clientIp,
      roomId,
    });

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: rateCheck.reason || 'Rate limit exceeded. Please slow down.',
        retryAfterMs: rateCheck.retryAfterMs,
      };
    }

    // Check if partner has blocked sender
    const partner = room.participants.find((p) => p.id !== sender.id);
    if (partner && safetyEngine.isUserBlocked(partner.id, sender.id)) {
      return { success: false, error: 'Message cannot be delivered' };
    }

    // Check if any participant is a minor for heightened child protection
    const hasMinor = room.participants.some(
      (p) => (p as any).ageGroup === 'MINOR_TEEN' || (p as any).ageGroup === 'CHILD'
    );

    // Content Sanitization, Toxic Word Masking & Grooming Detection
    const { cleanText } = safetyEngine.sanitizeMessage(text, hasMinor);

    // Stable UUID message identifier
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const message: RealtimeMessage = {
      id: messageId,
      roomId,
      senderId: sender.id,
      senderName: sender.displayName,
      senderAvatar: sender.avatar,
      text: cleanText,
      type,
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };

    room.status = 'ACTIVE';
    room.updatedAt = new Date().toISOString();
    room.messages.push(message);

    if (idempotencyKey) {
      const scopeKey = `${roomId}:${sender.id}:${idempotencyKey}`;
      this.idempotencyCache.set(scopeKey, { message, timestamp: Date.now() });
      if (this.idempotencyCache.size > 5000) {
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [k, v] of this.idempotencyCache.entries()) {
          if (v.timestamp < cutoff) this.idempotencyCache.delete(k);
        }
      }
    }

    // Broadcast to room members
    this.emitToRoom(roomId, 'chat_message', message);

    return {
      success: true,
      message,
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      text: message.text,
      type: message.type,
      timestamp: message.timestamp,
      status: message.status,
    };
  }

  // Typing status
  public sendTyping(roomId: string, userId: string, isTyping: boolean) {
    this.emitToRoom(roomId, 'typing', { roomId, userId, isTyping }, userId);
  }

  // Idempotent Skip / Leave Room
  public async leaveRoom(roomId: string, userId: string, reason: 'skipped' | 'disconnected' | 'blocked' | 'reported' = 'skipped'): Promise<{ success: boolean; alreadyClosed?: boolean }> {
    const room = this.activeRooms.get(roomId);
    if (!room) {
      return { success: true, alreadyClosed: true };
    }

    // Prevent duplicate teardown triggers
    if (room.status === 'SKIPPED' || room.status === 'CLOSED') {
      return { success: true, alreadyClosed: true };
    }

    room.status = 'SKIPPED';
    room.updatedAt = new Date().toISOString();

    // Record skip history for the other participant
    const partner = room.participants.find((p) => p.id !== userId);
    if (partner && reason === 'skipped') {
      await privacyService.recordSkip(userId, partner.id, roomId, reason);
    }

    this.emitToRoom(roomId, 'stranger_left', {
      roomId,
      userId,
      reason,
      message: reason === 'skipped'
        ? 'Stranger moved to the next orbit'
        : reason === 'blocked'
        ? 'Stranger was blocked'
        : reason === 'reported'
        ? 'Stranger was reported'
        : 'Stranger disconnected from orbit',
    });

    this.archiveRoom(room);
    this.activeRooms.delete(roomId);

    return { success: true };
  }

  private pubsubSubscriber: any = null;

  // Initialize distributed Redis pub/sub listener when REDIS_URL is configured
  public async initRedisPubSub(): Promise<void> {
    if (this.pubsubSubscriber || !isRedisConfigured()) return;
    try {
      const Redis = (await import('ioredis')).default;
      const sub = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 3000,
        enableOfflineQueue: false,
      });
      sub.on('error', () => {});
      await sub.connect();
      await sub.subscribe('phryvos:realtime:events');
      sub.on('message', (channel: string, messageStr: string) => {
        if (channel === 'phryvos:realtime:events') {
          try {
            const { userId, event, data } = JSON.parse(messageStr);
            if (userId && this.clients.has(userId)) {
              this.emitToUser(userId, event, data, false);
            }
          } catch {}
        }
      });
      this.pubsubSubscriber = sub;
    } catch (err: any) {
      console.warn('⚠️ [RealtimeEngine] Redis pub/sub initialization skipped:', err?.message || err);
    }
  }

  // Initialize privacy service caches and distributed pubsub (call on server startup)
  public async initializeCaches(): Promise<void> {
    await privacyService.loadBlocksFromDB();
    await privacyService.loadSkipHistoryFromDB();
    await this.initRedisPubSub();
  }

  // Friend Request
  public sendFriendRequest(roomId: string, sender: RealtimeUser & { requestId?: string }) {
    this.emitToRoom(roomId, 'connection_request', {
      roomId,
      from: sender,
      requestId: sender.requestId,
    }, sender.id);
  }

  // Accept Friend Request
  public acceptFriendRequest(roomId: string, sender: RealtimeUser) {
    this.emitToRoom(roomId, 'connection_accepted', {
      roomId,
      from: sender,
    });
  }

  public getOnlineCount(): number {
    return this.clients.size;
  }
}

// Global Singleton across Next.js reloads
declare global {
  var __phryvos_realtime_engine__: RealtimeServerEngine | undefined;
}

export const realtimeEngine =
  globalThis.__phryvos_realtime_engine__ ||
  (globalThis.__phryvos_realtime_engine__ = new RealtimeServerEngine());
