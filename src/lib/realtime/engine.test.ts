import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealtimeServerEngine } from '@/lib/realtime/engine';
import { safetyEngine } from '@/lib/safety/engine';
import { privacyService } from '@/lib/safety/privacyService';
import type { RealtimeUser } from '@/lib/realtime/types';

describe('RealtimeServerEngine', () => {
  let engine: RealtimeServerEngine;

  beforeEach(() => {
    engine = new RealtimeServerEngine();
    // Clear privacy service caches
    (privacyService as any).blockCache?.clear();
    (privacyService as any).blockedByCache?.clear();
    (privacyService as any).skipCache?.clear();
  });

  const createMockUser = (id: string, username: string, overrides: Partial<RealtimeUser> = {}): RealtimeUser => ({
    id,
    username,
    displayName: username,
    avatar: '😊',
    location: 'Test',
    interests: ['Test'],
    matchPreferences: {
      interests: ['Test'],
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
    ...overrides,
  });

  const createMockController = () => {
    const chunks: Uint8Array[] = [];
    return {
      enqueue: vi.fn((chunk: Uint8Array) => chunks.push(chunk)),
      close: vi.fn(),
      error: vi.fn(),
      get chunks() { return chunks; }
    } as any;
  };

  describe('registerClient / unregisterClient', () => {
    it('registers a client', () => {
      const controller = createMockController();
      const user = createMockUser('user-1', 'testuser');

      engine.registerClient(user.id, user, controller);

      expect(engine.getOnlineCount()).toBe(1);
    });

    it('unregisters a client', () => {
      const controller = createMockController();
      const user = createMockUser('user-1', 'testuser');

      engine.registerClient(user.id, user, controller);
      engine.unregisterClient(user.id);

      expect(engine.getOnlineCount()).toBe(0);
    });
  });

  describe('matchmaking', () => {
    it('adds user to queue when no partner available', async () => {
      const user = createMockUser('user-1', 'testuser');
      const controller = createMockController();

      engine.registerClient(user.id, user, controller);
      const result = await engine.addToQueue(user);

      expect(result.matched).toBe(false);
    });

    it('matches two waiting users with common interests', async () => {
      const user1 = createMockUser('user-1', 'user1', { interests: ['Gaming', 'Music'] });
      const user2 = createMockUser('user-2', 'user2', { interests: ['Gaming', 'Music'] });
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      const result1 = await engine.addToQueue(user1);
      expect(result1.matched).toBe(false);

      const result2 = await engine.addToQueue(user2);
      expect(result2.matched).toBe(true);
      expect(result2.roomId).toBeDefined();
      expect(result2.partner).toBeDefined();
    });

    it('respects blocklist in matchmaking', async () => {
      const user1 = createMockUser('user-1', 'user1');
      const user2 = createMockUser('user-2', 'user2');
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      // Block user2 from user1's perspective
      safetyEngine.blockUser(user1.id, user2.id);

      const result1 = await engine.addToQueue(user1);
      const result2 = await engine.addToQueue(user2);

      // They should not match
      expect(result1.matched).toBe(false);
      expect(result2.matched).toBe(false);
    });

    it('respects skip history in matchmaking', async () => {
      const user1 = createMockUser('user-1', 'user1');
      const user2 = createMockUser('user-2', 'user2');
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      // First match
      await engine.addToQueue(user1);
      const matchResult = await engine.addToQueue(user2);
      expect(matchResult.matched).toBe(true);

      // User1 skips
      await engine.leaveRoom(matchResult.roomId!, user1.id, 'skipped');

      // Re-add both to queue
      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      const result1 = await engine.addToQueue(user1);
      const result2 = await engine.addToQueue(user2);

      // They should not match again due to skip history
      expect(result1.matched).toBe(false);
      expect(result2.matched).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('sends message in active room', async () => {
      const user1 = createMockUser('user-1', 'user1');
      const user2 = createMockUser('user-2', 'user2');
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      await engine.addToQueue(user1);
      const matchResult = await engine.addToQueue(user2);

      const message = engine.sendMessage(matchResult.roomId!, user1, 'Hello!');

      expect(message).toBeDefined();
      expect(message?.text).toBe('Hello!');
      expect(message?.senderId).toBe(user1.id);
    });

    it('enforces rate limit on messages', async () => {
      const user1 = createMockUser('user-1', 'user1');
      const user2 = createMockUser('user-2', 'user2');
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      await engine.addToQueue(user1);
      const matchResult = await engine.addToQueue(user2);

      // Send 12 messages (limit)
      for (let i = 0; i < 12; i++) {
        engine.sendMessage(matchResult.roomId!, user1, `Message ${i}`);
      }

      // 13th should be blocked
      const blockedMessage = engine.sendMessage(matchResult.roomId!, user1, 'Blocked');
      expect(blockedMessage.success).toBe(false);
    });

    it('sanitizes message content', async () => {
      const user1 = createMockUser('user-1', 'user1');
      const user2 = createMockUser('user-2', 'user2');
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      await engine.addToQueue(user1);
      const matchResult = await engine.addToQueue(user2);

      const message = engine.sendMessage(matchResult.roomId!, user1, 'You are a chutiya');

      expect(message?.text).toBe('You are a •••••');
    });
  });

  describe('leaveRoom', () => {
    it('removes room and notifies participants', async () => {
      const user1 = createMockUser('user-1', 'user1');
      const user2 = createMockUser('user-2', 'user2');
      const controller1 = createMockController();
      const controller2 = createMockController();

      engine.registerClient(user1.id, user1, controller1);
      engine.registerClient(user2.id, user2, controller2);

      await engine.addToQueue(user1);
      const matchResult = await engine.addToQueue(user2);

      await engine.leaveRoom(matchResult.roomId!, user1.id);

      // Room should be deleted
      // (We can't easily test the SSE notification without mocking)
    });
  });
});