import { describe, it, expect, beforeEach } from 'vitest';
import { SafetyEngine } from '@/lib/safety/engine';

describe('SafetyEngine', () => {
  let engine: SafetyEngine;

  beforeEach(() => {
    engine = new SafetyEngine();
  });

  describe('checkRateLimit', () => {
    it('allows requests under the limit', () => {
      const result = engine.checkRateLimit('user-1');
      expect(result.allowed).toBe(true);
    });

    it('tracks request count per user', () => {
      for (let i = 0; i < 10; i++) {
        const result = engine.checkRateLimit('user-1');
        expect(result.allowed).toBe(true);
      }
    });

    it('blocks requests over the limit (12 per 5 seconds)', () => {
      for (let i = 0; i < 12; i++) {
        engine.checkRateLimit('user-1');
      }
      const result = engine.checkRateLimit('user-1');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('separates limits by user', () => {
      for (let i = 0; i < 12; i++) {
        engine.checkRateLimit('user-1');
      }
      const result = engine.checkRateLimit('user-2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('sanitizeMessage', () => {
    it('returns clean text unchanged', () => {
      const result = engine.sanitizeMessage('Hello world!');
      expect(result.cleanText).toBe('Hello world!');
      expect(result.isToxic).toBe(false);
    });

    it('masks profanity', () => {
      const result = engine.sanitizeMessage('You are a chutiya');
      expect(result.cleanText).toBe('You are a •••••');
      expect(result.isToxic).toBe(true);
    });

    it('masks multiple profanity words', () => {
      const result = engine.sanitizeMessage('chutiya and madarchod');
      expect(result.cleanText).toBe('••••• and ••••••••');
      expect(result.isToxic).toBe(true);
    });

    it('is case insensitive', () => {
      const result = engine.sanitizeMessage('CHUTIYA');
      expect(result.cleanText).toBe('•••••');
      expect(result.isToxic).toBe(true);
    });
  });

  describe('blockUser', () => {
    it('adds user to blocklist', () => {
      engine.blockUser('user-1', 'user-2');
      expect(engine.isUserBlocked('user-1', 'user-2')).toBe(true);
    });

    it('does not block reverse direction', () => {
      engine.blockUser('user-1', 'user-2');
      expect(engine.isUserBlocked('user-2', 'user-1')).toBe(false);
    });
  });

  describe('reportUser', () => {
    it('creates a report incident', () => {
      const incident = engine.reportUser('user-1', 'user-2', 'Harassment');
      expect(incident.reporterId).toBe('user-1');
      expect(incident.reportedUserId).toBe('user-2');
      expect(incident.reason).toBe('Harassment');
    });

    it('auto-blocks reported user from reporter', () => {
      engine.reportUser('user-1', 'user-2', 'Harassment');
      expect(engine.isUserBlocked('user-1', 'user-2')).toBe(true);
    });

    it('increments report count', () => {
      engine.reportUser('user-1', 'user-2', 'Harassment');
      engine.reportUser('user-3', 'user-2', 'Spam');
      const reports = engine.getReports();
      expect(reports.length).toBe(2);
    });

    it('flags user after 3 reports', () => {
      engine.reportUser('user-1', 'user-2', 'Harassment');
      engine.reportUser('user-3', 'user-2', 'Spam');
      engine.reportUser('user-4', 'user-2', 'Abuse');
      const reports = engine.getReports();
      expect(reports.length).toBe(3);
    });
  });
});