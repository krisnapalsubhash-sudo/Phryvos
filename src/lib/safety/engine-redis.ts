import { safetyEngine } from '@/lib/safety/engine';
import { redis } from '@/lib/redis/client';

const KEYS = {
  RATE_LIMIT: (userId: string) => `phryvos:ratelimit:${userId}`,
  BLOCK: (userId: string) => `phryvos:block:${userId}`,
  REPORTS: 'phryvos:reports',
  REPORT: (reportId: string) => `phryvos:report:${reportId}`,
  REPORT_COUNT: (userId: string) => `phryvos:reportcount:${userId}`,
  MUTED: 'phryvos:muted',
} as const;

class SafetyRedisEngine {
  async checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const key = KEYS.RATE_LIMIT(userId);
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, 5);
    }

    if (current > 12) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        retryAfterMs: ttl > 0 ? ttl * 1000 : 5000,
      };
    }

    return { allowed: true };
  }

  sanitizeMessage(text: string): { cleanText: string; isToxic: boolean } {
    return safetyEngine.sanitizeMessage(text);
  }

  async blockUser(sourceUserId: string, targetUserId: string) {
    await redis.sadd(KEYS.BLOCK(sourceUserId), targetUserId);
  }

  async isUserBlocked(sourceUserId: string, targetUserId: string): Promise<boolean> {
    const result = await redis.sismember(KEYS.BLOCK(sourceUserId), targetUserId);
    return result === 1;
  }

  async getBlockedUsers(userId: string): Promise<string[]> {
    return await redis.smembers(KEYS.BLOCK(userId));
  }

  async unblockUser(sourceUserId: string, targetUserId: string) {
    await redis.srem(KEYS.BLOCK(sourceUserId), targetUserId);
  }

  async reportUser(reporterId: string, reportedUserId: string, reason: string, description?: string) {
    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const report = {
      id: reportId,
      reporterId,
      reportedUserId,
      reason,
      description,
      timestamp: new Date().toISOString(),
    };

    await redis.hset(KEYS.REPORT(reportId), report);
    await redis.lpush(KEYS.REPORTS, reportId);
    await redis.ltrim(KEYS.REPORTS, 0, 499);

    const count = await redis.incr(KEYS.REPORT_COUNT(reportedUserId));

    await this.blockUser(reporterId, reportedUserId);

    if (count >= 3) {
      await this.flagUser(reportedUserId, `Auto-flagged after ${count} reports`);
    }

    return report;
  }

  async flagUser(userId: string, reason: string) {
    console.warn(`User ${userId} flagged: ${reason}`);
  }

  async getReports(limit: number = 50) {
    const reportIds = await redis.lrange(KEYS.REPORTS, 0, limit - 1);
    const reports = [];
    for (const id of reportIds) {
      const report = await redis.hgetall(KEYS.REPORT(id));
      if (report.id) reports.push(report);
    }
    return reports;
  }

  async getReportCount(userId: string): Promise<number> {
    return await redis.get(KEYS.REPORT_COUNT(userId)).then(Number) || 0;
  }

  async isMuted(userId: string): Promise<boolean> {
    const result = await redis.sismember(KEYS.MUTED, userId);
    return result === 1;
  }

  async muteUser(userId: string) {
    await redis.sadd(KEYS.MUTED, userId);
  }

  async unmuteUser(userId: string) {
    await redis.srem(KEYS.MUTED, userId);
  }
}

export const safetyRedisEngine = new SafetyRedisEngine();