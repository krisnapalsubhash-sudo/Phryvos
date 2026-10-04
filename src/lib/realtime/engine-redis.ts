import Redis from 'ioredis';
import { safetyEngine } from '@/lib/safety/engine';
import type { RealtimeUser, RealtimeMessage, RealtimeRoom, RealtimeEventType } from './types';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ||
  (globalForRedis.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: true,
  }));

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

const KEYS = {
  MATCH_QUEUE: 'phryvos:match:queue',
  ACTIVE_ROOMS: 'phryvos:rooms',
  ROOM: (roomId: string) => `phryvos:room:${roomId}`,
  ROOM_PARTICIPANTS: (roomId: string) => `phryvos:room:${roomId}:participants`,
  ROOM_MESSAGES: (roomId: string) => `phryvos:room:${roomId}:messages`,
  CLIENTS: 'phryvos:clients',
  CLIENT: (userId: string) => `phryvos:client:${userId}`,
  PRESENCE: 'phryvos:presence',
  ONLINE_COUNT: 'phryvos:online_count',
} as const;

interface MatchQueueEntry {
  userId: string;
  user: RealtimeUser;
  joinedAt: number;
}

class RealtimeRedisEngine {
  private pubSub: Redis | null = null;
  private subscribedRooms: Set<string> = new Set();

  async connect() {
    if (!redis.status || redis.status === 'wait') {
      await redis.connect();
    }
    this.pubSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await this.pubSub.connect();
  }

  async disconnect() {
    await redis.quit();
    if (this.pubSub) await this.pubSub.quit();
  }

  async registerClient(userId: string, user: RealtimeUser) {
    const clientData = {
      userId,
      user: JSON.stringify(user),
      connectedAt: Date.now(),
    };
    await redis.hset(KEYS.CLIENT(userId), clientData);
    await redis.sadd(KEYS.CLIENTS, userId);
    await redis.incr(KEYS.ONLINE_COUNT);
    await this.broadcastPresence();
  }

  async unregisterClient(userId: string) {
    await redis.del(KEYS.CLIENT(userId));
    await redis.srem(KEYS.CLIENTS, userId);
    await this.removeFromQueue(userId);
    await redis.decr(KEYS.ONLINE_COUNT);
    await this.broadcastPresence();
  }

  async broadcastPresence() {
    const onlineCount = await redis.get(KEYS.ONLINE_COUNT).then(Number) || 0;
    const queueCount = await redis.zcard(KEYS.MATCH_QUEUE);

    const data = {
      onlineCount: Math.max(1, onlineCount),
      queueCount,
      timestamp: new Date().toISOString(),
    };

    await redis.publish('phryvos:presence', JSON.stringify(data));
  }

  async addToQueue(user: RealtimeUser): Promise<{ matched: boolean; roomId?: string; partner?: RealtimeUser }> {
    await this.removeFromQueue(user.id);

    const queue: string[] = await (redis as any).zrange(KEYS.MATCH_QUEUE, 0, -1, 'WITHSCORES');

    for (let i = 0; i < queue.length; i += 2) {
      const value = queue[i];
      const entry: MatchQueueEntry = JSON.parse(value);
      if (
        entry.userId !== user.id &&
        !safetyEngine.isUserBlocked(user.id, entry.userId) &&
        !safetyEngine.isUserBlocked(entry.userId, user.id)
      ) {
        await redis.zrem(KEYS.MATCH_QUEUE, value);

        const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newRoom: RealtimeRoom = {
          id: roomId,
          participants: [entry.user, user],
          createdAt: new Date().toISOString(),
          messages: [],
        };

        await redis.hset(KEYS.ROOM(roomId), {
          id: newRoom.id,
          participants: JSON.stringify(newRoom.participants),
          createdAt: newRoom.createdAt,
          messages: JSON.stringify(newRoom.messages),
        });
        await redis.sadd(KEYS.ROOM_PARTICIPANTS(roomId), user.id, entry.userId);
        await redis.sadd(KEYS.ACTIVE_ROOMS, roomId);

        await this.publishToUser(user.id, 'match_found', {
          roomId,
          partner: entry.user,
          role: 'initiator',
        });
        await this.publishToUser(entry.userId, 'match_found', {
          roomId,
          partner: user,
          role: 'receiver',
        });

        await this.broadcastPresence();
        return { matched: true, roomId, partner: entry.user };
      }
    }

    const entry: MatchQueueEntry = {
      userId: user.id,
      user,
      joinedAt: Date.now(),
    };
    await redis.zadd(KEYS.MATCH_QUEUE, entry.joinedAt, JSON.stringify(entry));

    await this.publishToUser(user.id, 'queue_joined', {
      position: await redis.zcard(KEYS.MATCH_QUEUE),
    });

    await this.broadcastPresence();
    return { matched: false };
  }

  async removeFromQueue(userId: string) {
    const queue: string[] = await (redis as any).zrange(KEYS.MATCH_QUEUE, 0, -1, 'WITHSCORES');
    for (let i = 0; i < queue.length; i += 2) {
      const value = queue[i];
      const entry: MatchQueueEntry = JSON.parse(value);
      if (entry.userId === userId) {
        await redis.zrem(KEYS.MATCH_QUEUE, value);
        break;
      }
    }
    await this.broadcastPresence();
  }

  async sendMessage(roomId: string, sender: RealtimeUser, text: string, type: 'text' | 'image' | 'voice' = 'text') {
    const room = await redis.hgetall(KEYS.ROOM(roomId));
    if (!room.id) return null;

    const rateCheck = safetyEngine.checkRateLimit(sender.id);
    if (!rateCheck.allowed) return null;

    const { cleanText } = safetyEngine.sanitizeMessage(text);

    const message: RealtimeMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      senderId: sender.id,
      senderName: sender.displayName,
      senderAvatar: sender.avatar,
      text: cleanText,
      type,
      timestamp: new Date().toISOString(),
    };

    await redis.lpush(KEYS.ROOM_MESSAGES(roomId), JSON.stringify(message));
    await redis.ltrim(KEYS.ROOM_MESSAGES(roomId), 0, 499);

    const messages = await this.getRoomMessages(roomId);
    await redis.hset(KEYS.ROOM(roomId), { messages: JSON.stringify(messages) });

    await this.publishToRoom(roomId, 'chat_message', message, sender.id);
    return message;
  }

  async sendTyping(roomId: string, userId: string, isTyping: boolean) {
    await this.publishToRoom(roomId, 'typing', { roomId, userId, isTyping }, userId);
  }

  async leaveRoom(roomId: string, userId: string) {
    await redis.srem(KEYS.ROOM_PARTICIPANTS(roomId), userId);
    const participants = await redis.smembers(KEYS.ROOM_PARTICIPANTS(roomId));

    if (participants.length === 0) {
      await redis.del(KEYS.ROOM(roomId));
      await redis.del(KEYS.ROOM_PARTICIPANTS(roomId));
      await redis.del(KEYS.ROOM_MESSAGES(roomId));
      await redis.srem(KEYS.ACTIVE_ROOMS, roomId);
    }

    await this.publishToRoom(roomId, 'stranger_left', {
      roomId,
      userId,
      message: 'Stranger moved to the next orbit',
    }, userId);
  }

  async sendFriendRequest(roomId: string, sender: RealtimeUser) {
    await this.publishToRoom(roomId, 'connection_request', {
      roomId,
      from: sender,
    }, sender.id);
  }

  async acceptFriendRequest(roomId: string, sender: RealtimeUser) {
    await this.publishToRoom(roomId, 'connection_accepted', {
      roomId,
      from: sender,
    });
  }

  async getRoomMessages(roomId: string): Promise<RealtimeMessage[]> {
    const messages = await redis.lrange(KEYS.ROOM_MESSAGES(roomId), 0, -1);
    return messages.map((m: string) => JSON.parse(m)).reverse();
  }

  async getOnlineCount(): Promise<number> {
    return await redis.get(KEYS.ONLINE_COUNT).then(Number) || 0;
  }

  async publishToUser(userId: string, event: RealtimeEventType, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await redis.publish(`phryvos:user:${userId}`, payload);
  }

  async publishToRoom(roomId: string, event: RealtimeEventType, data: any, excludeUserId?: string) {
    const participants = await redis.smembers(KEYS.ROOM_PARTICIPANTS(roomId));
    for (const participantId of participants) {
      if (excludeUserId && participantId === excludeUserId) continue;
      await this.publishToUser(participantId, event, data);
    }
  }

  async subscribeToUser(userId: string, controller: ReadableStreamDefaultController) {
    if (!this.pubSub) await this.connect();

    const channel = `phryvos:user:${userId}`;
    await this.pubSub!.subscribe(channel);

    this.pubSub!.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          controller.enqueue(new TextEncoder().encode(message));
        } catch {
          this.unsubscribeFromUser(userId);
        }
      }
    });
  }

  async unsubscribeFromUser(userId: string) {
    if (this.pubSub) {
      await this.pubSub.unsubscribe(`phryvos:user:${userId}`);
    }
  }
}

export const realtimeRedisEngine = new RealtimeRedisEngine();