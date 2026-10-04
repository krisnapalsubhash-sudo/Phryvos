import { getPrismaClient } from '@/lib/db/prisma';
import { agePolicyService } from './agePolicy';
import type { RealtimeUser, MatchPreferences } from '@/lib/realtime/types';

export interface MatchScoreResult {
  allowed: boolean;
  score: number;
  reasons: string[];
}

export class PrivacyService {
  // Fast in-memory cache of blocks: blockerId -> Set of blockedUserIds
  private blockCache: Map<string, Set<string>> = new Map();
  // Reverse index for bi-directional checks: blockedId -> Set of blockerUserIds
  private blockedByCache: Map<string, Set<string>> = new Map();
  // Skip history cache: userId -> Set of skippedUserIds
  private skipCache: Map<string, Set<string>> = new Map();

  /**
   * Block a user persistently in database and cache
   */
  public async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    if (!blockerId || !blockedId || blockerId === blockedId) return false;

    // 1. Update in-memory caches instantly
    let blockerSet = this.blockCache.get(blockerId);
    if (!blockerSet) {
      blockerSet = new Set();
      this.blockCache.set(blockerId, blockerSet);
    }
    blockerSet.add(blockedId);

    let blockedBySet = this.blockedByCache.get(blockedId);
    if (!blockedBySet) {
      blockedBySet = new Set();
      this.blockedByCache.set(blockedId, blockedBySet);
    }
    blockedBySet.add(blockerId);

    // 2. Persist to PostgreSQL database asynchronously
    try {
      const prisma = getPrismaClient();
      if (prisma.block) {
        await prisma.block.upsert({
          where: {
            blockerId_blockedId: {
              blockerId,
              blockedId,
            },
          },
          create: {
            blockerId,
            blockedId,
          },
          update: {},
        });
      }
    } catch (err) {
      // Safe fallback if database is offline or in build mode
      console.warn('Database block persistence deferred:', (err as any)?.message);
    }

    return true;
  }

  /**
   * Unblock a user in database and cache
   */
  public async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const blockerSet = this.blockCache.get(blockerId);
    if (blockerSet) blockerSet.delete(blockedId);

    const blockedBySet = this.blockedByCache.get(blockedId);
    if (blockedBySet) blockedBySet.delete(blockerId);

    try {
      const prisma = getPrismaClient();
      if (prisma.block) {
        await prisma.block.deleteMany({
          where: { blockerId, blockedId },
        });
      }
    } catch (err) {
      console.warn('Database unblock error:', (err as any)?.message);
    }

    return true;
  }

  /**
   * Check if communication/interaction between two users is blocked in either direction
   */
  public async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    if (!userAId || !userBId) return false;

    // 1. Check in-memory fast cache first
    const aBlocksB = this.blockCache.get(userAId)?.has(userBId);
    const bBlocksA = this.blockCache.get(userBId)?.has(userAId);
    if (aBlocksB || bBlocksA) return true;

    // 2. Query database for persistent records if not in memory
    try {
      const prisma = getPrismaClient();
      if (prisma.block) {
        const dbBlock = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: userAId, blockedId: userBId },
              { blockerId: userBId, blockedId: userAId },
            ],
          },
        });

        if (dbBlock) {
          // Warm up cache
          this.cacheBlock(dbBlock.blockerId, dbBlock.blockedId);
          return true;
        }
      }
    } catch {
      // Return false if database unavailable and cache was empty
    }

    return false;
  }

  /**
   * Synchronous check for real-time loops (uses memory cache)
   */
  public isBlockedSync(userAId: string, userBId: string): boolean {
    const aBlocksB = this.blockCache.get(userAId)?.has(userBId);
    const bBlocksA = this.blockCache.get(userBId)?.has(userAId);
    return !!(aBlocksB || bBlocksA);
  }

  /**
   * Check if userA has skipped userB (skip history)
   */
  public async isSkipped(userAId: string, userBId: string): Promise<boolean> {
    if (!userAId || !userBId || userAId === userBId) return false;

    // 1. Check in-memory cache
    const skipped = this.skipCache.get(userAId)?.has(userBId);
    if (skipped) return true;

    // 2. Query database
    try {
      const prisma: any = getPrismaClient();
      if (prisma.skipHistory) {
        const record = await prisma.skipHistory.findUnique({
          where: {
            userId_skippedId: {
              userId: userAId,
              skippedId: userBId,
            },
          },
        });
        if (record) {
          // Warm up cache
          let skipSet = this.skipCache.get(userAId);
          if (!skipSet) {
            skipSet = new Set();
            this.skipCache.set(userAId, skipSet);
          }
          skipSet.add(userBId);
          return true;
        }
      }
    } catch {
      // Return false if database unavailable
    }

    return false;
  }

  /**
   * Synchronous skip check for real-time loops
   */
  public isSkippedSync(userAId: string, userBId: string): boolean {
    return this.skipCache.get(userAId)?.has(userBId) ?? false;
  }

  /**
   * Record a skip in history
   */
  public async recordSkip(userId: string, skippedId: string, roomId?: string, reason?: string): Promise<void> {
    if (!userId || !skippedId || userId === skippedId) return;

    // Update in-memory cache
    let skipSet = this.skipCache.get(userId);
    if (!skipSet) {
      skipSet = new Set();
      this.skipCache.set(userId, skipSet);
    }
    skipSet.add(skippedId);

    // Persist to database
    try {
      const prisma: any = getPrismaClient();
      if (prisma.skipHistory) {
        await prisma.skipHistory.upsert({
          where: {
            userId_skippedId: {
              userId,
              skippedId,
            },
          },
          create: {
            userId,
            skippedId,
            roomId,
            reason,
            count: 1,
          },
          update: {
            roomId,
            reason,
            count: { increment: 1 },
          },
        });
      }
    } catch (err) {
      console.warn('Database skip persistence deferred:', (err as any)?.message);
    }
  }

  /**
   * Clear skip history for a user
   */
  public async clearSkipHistory(userId: string): Promise<void> {
    this.skipCache.delete(userId);

    try {
      const prisma: any = getPrismaClient();
      if (prisma.skipHistory) {
        await prisma.skipHistory.deleteMany({
          where: { userId },
        });
      }
    } catch (err) {
      console.warn('Database skip history clear error:', (err as any)?.message);
    }
  }

  /**
   * Filter an array of items (users, posts, notifications) to exclude any blocked relations
   */
  public async filterBlocked<T extends { id: string }>(
    currentUserId: string,
    items: T[]
  ): Promise<T[]> {
    if (!currentUserId || items.length === 0) return items;

    const filtered: T[] = [];
    for (const item of items) {
      const blocked = await this.isBlocked(currentUserId, item.id);
      if (!blocked) {
        filtered.push(item);
      }
    }
    return filtered;
  }

  /**
   * Can User A view User B's profile?
   */
  public async canViewProfile(viewerId: string, targetId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    if (viewerId === targetId) return { allowed: true };

    const blocked = await this.isBlocked(viewerId, targetId);
    if (blocked) {
      return { allowed: false, reason: 'Profile unavailable.' };
    }

    return { allowed: true };
  }

  /**
   * Calculate interest match score between two users
   */
  private calculateInterestScore(
    prefsA: MatchPreferences | undefined,
    prefsB: MatchPreferences | undefined,
    userA: RealtimeUser,
    userB: RealtimeUser
  ): {
    score: number;
    overlapCount: number;
    categoryCounts: {
      interests: number;
      languages: number;
      games: number;
      hobbies: number;
      topics: number;
    };
    reasons: string[];
  } {
    const defaultRes = {
      score: 0,
      overlapCount: 0,
      categoryCounts: { interests: 0, languages: 0, games: 0, hobbies: 0, topics: 0 },
      reasons: [],
    };

    if (!prefsA?.enableInterestMatch && !prefsB?.enableInterestMatch) {
      return { ...defaultRes, score: 50 };
    }

    let score = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // Interest overlap (weight: 30) - Set deduplication prevents inflation
    const interestsA = new Set([...(userA.interests || []), ...(prefsA?.interests || [])]);
    const interestsB = new Set([...(userB.interests || []), ...(prefsB?.interests || [])]);
    const interestOverlap = [...interestsA].filter((i) => interestsB.has(i));
    if (interestOverlap.length > 0) {
      const overlapRatio = interestOverlap.length / Math.max(interestsA.size, interestsB.size, 1);
      score += Math.round(30 * overlapRatio);
      reasons.push(...interestOverlap.map((i) => `Interest: ${i}`));
    }

    // Language overlap (weight: 25)
    const langsA = new Set([...(userA.languages || []), ...(prefsA?.languages || [])]);
    const langsB = new Set([...(userB.languages || []), ...(prefsB?.languages || [])]);
    const langOverlap = [...langsA].filter((l) => langsB.has(l));
    if (langOverlap.length > 0) {
      const overlapRatio = langOverlap.length / Math.max(langsA.size, langsB.size, 1);
      score += Math.round(25 * overlapRatio);
      reasons.push(...langOverlap.map((l) => `Language: ${l}`));
    }

    // Game tags overlap (weight: 20)
    const gamesA = new Set([...(userA.gameTags || []), ...(prefsA?.gameTags || [])]);
    const gamesB = new Set([...(userB.gameTags || []), ...(prefsB?.gameTags || [])]);
    const gameOverlap = [...gamesA].filter((g) => gamesB.has(g));
    if (gameOverlap.length > 0) {
      const overlapRatio = gameOverlap.length / Math.max(gamesA.size, gamesB.size, 1);
      score += Math.round(20 * overlapRatio);
      reasons.push(...gameOverlap.map((g) => `Game: ${g}`));
    }

    // Hobby tags overlap (weight: 15)
    const hobbiesA = new Set([...(userA.hobbyTags || []), ...(prefsA?.hobbyTags || [])]);
    const hobbiesB = new Set([...(userB.hobbyTags || []), ...(prefsB?.hobbyTags || [])]);
    const hobbyOverlap = [...hobbiesA].filter((h) => hobbiesB.has(h));
    if (hobbyOverlap.length > 0) {
      const overlapRatio = hobbyOverlap.length / Math.max(hobbiesA.size, hobbiesB.size, 1);
      score += Math.round(15 * overlapRatio);
      reasons.push(...hobbyOverlap.map((h) => `Hobby: ${h}`));
    }

    // Topic tags overlap (weight: 10)
    const topicsA = new Set([...(userA.topicTags || []), ...(prefsA?.topicTags || [])]);
    const topicsB = new Set([...(userB.topicTags || []), ...(prefsB?.topicTags || [])]);
    const topicOverlap = [...topicsA].filter((t) => topicsB.has(t));
    if (topicOverlap.length > 0) {
      const overlapRatio = topicOverlap.length / Math.max(topicsA.size, topicsB.size, 1);
      score += Math.round(10 * overlapRatio);
      reasons.push(...topicOverlap.map((t) => `Topic: ${t}`));
    }

    const categoryCounts = {
      interests: interestOverlap.length,
      languages: langOverlap.length,
      games: gameOverlap.length,
      hobbies: hobbyOverlap.length,
      topics: topicOverlap.length,
    };

    const overlapCount =
      interestOverlap.length +
      langOverlap.length +
      gameOverlap.length +
      hobbyOverlap.length +
      topicOverlap.length;

    return {
      score: Math.min(score, maxScore),
      overlapCount,
      categoryCounts,
      reasons,
    };
  }

  /**
   * Calculate age compatibility score
   */
  private calculateAgeScore(prefsA: MatchPreferences | undefined, prefsB: MatchPreferences | undefined, userA: RealtimeUser, userB: RealtimeUser): { score: number; reason?: string } {
    // Extract ages
    const getAge = (user: RealtimeUser, prefs: MatchPreferences | undefined): number | null => {
      if (user.birthDate) {
        const birth = new Date(user.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      }
      if (prefs?.minAge && prefs?.maxAge) {
        return Math.floor((prefs.minAge + prefs.maxAge) / 2);
      }
      return null;
    };

    const ageA = getAge(userA, prefsA);
    const ageB = getAge(userB, prefsB);

    if (ageA === null || ageB === null) {
      return { score: 25, reason: undefined }; // Neutral if ages unknown
    }

    const ageDiff = Math.abs(ageA - ageB);
    const prefA = prefsA?.ageGroupPref || 'SAME';
    const prefB = prefsB?.ageGroupPref || 'SAME';

    // Check preferences
    if (prefA === 'SAME' && prefB === 'SAME') {
      if (ageDiff <= 2) return { score: 30, reason: `Similar age (±${ageDiff} years)` };
      if (ageDiff <= 5) return { score: 20, reason: `Close age (±${ageDiff} years)` };
      return { score: 5, reason: `Age gap: ${ageDiff} years` };
    }

    if (prefA === 'ANY' || prefB === 'ANY') {
      if (ageDiff <= 10) return { score: 20, reason: `Age gap: ${ageDiff} years (open preference)` };
      return { score: 10, reason: `Age gap: ${ageDiff} years` };
    }

    // OLDER/YOUNGER preferences
    if (prefA === 'OLDER' && ageB > ageA) return { score: 25, reason: 'Prefers older' };
    if (prefA === 'YOUNGER' && ageB < ageA) return { score: 25, reason: 'Prefers younger' };
    if (prefB === 'OLDER' && ageA > ageB) return { score: 25, reason: 'Partner prefers older' };
    if (prefB === 'YOUNGER' && ageA < ageB) return { score: 25, reason: 'Partner prefers younger' };

    return { score: 10, reason: `Age gap: ${ageDiff} years` };
  }

  /**
   * Can User A discover User B in Stranger Radar?
   * Verifies Block status, Age Assurance, Skip History, and Interest Matching
   */
  public async canDiscoverInRadar(userA: RealtimeUser, userB: RealtimeUser): Promise<MatchScoreResult> {
    if (userA.id === userB.id) {
      return { allowed: false, score: 0, reasons: ['Same user'] };
    }

    // 1. Block verification
    if (this.isBlockedSync(userA.id, userB.id)) {
      return { allowed: false, score: 0, reasons: ['Blocked'] };
    }

    // 2. Skip history verification
    if (this.isSkippedSync(userA.id, userB.id)) {
      // Check if either user allows skip rematch
      const allowA = userA.matchPreferences?.allowSkipRematch ?? false;
      const allowB = userB.matchPreferences?.allowSkipRematch ?? false;
      if (!allowA || !allowB) {
        return { allowed: false, score: 0, reasons: ['Previously skipped'] };
      }
    }

    // 3. Age assurance & minor-adult separation verification
    const ageA: any = { id: userA.id, ageGroup: (userA as any).ageGroup || 'UNVERIFIED', birthDate: (userA as any).birthDate };
    const ageB: any = { id: userB.id, ageGroup: (userB as any).ageGroup || 'UNVERIFIED', birthDate: (userB as any).birthDate };
    const ageCheck = agePolicyService.canInteractInStrangerRadar(ageA, ageB);
    if (!ageCheck.allowed) {
      return { allowed: false, score: 0, reasons: [ageCheck.reason || 'Age policy violation'] };
    }

    // 4. Interest-based matching score
    const prefsA = userA.matchPreferences;
    const prefsB = userB.matchPreferences;

    const interestResult = this.calculateInterestScore(prefsA, prefsB, userA, userB);
    const ageResult = this.calculateAgeScore(prefsA, prefsB, userA, userB);

    // Hard min-interest gate
    const requiresInterestMatch = (prefsA?.enableInterestMatch ?? true) && (prefsB?.enableInterestMatch ?? true);
    if (requiresInterestMatch) {
      const minOverlap = Math.max(prefsA?.minInterestOverlap ?? 1, prefsB?.minInterestOverlap ?? 1);
      if (interestResult.overlapCount < minOverlap) {
        return {
          allowed: false,
          score: 0,
          reasons: [`Insufficient shared interests (${interestResult.overlapCount}/${minOverlap} required)`],
        };
      }
    }

    const totalScore = interestResult.score + ageResult.score;
    const allReasons = [...interestResult.reasons];
    if (ageResult.reason) allReasons.push(ageResult.reason);

    return {
      allowed: true,
      score: totalScore,
      reasons: allReasons,
    };
  }

  private cacheBlock(blockerId: string, blockedId: string) {
    let s1 = this.blockCache.get(blockerId);
    if (!s1) {
      s1 = new Set();
      this.blockCache.set(blockerId, s1);
    }
    s1.add(blockedId);

    let s2 = this.blockedByCache.get(blockedId);
    if (!s2) {
      s2 = new Set();
      this.blockedByCache.set(blockedId, s2);
    }
    s2.add(blockerId);
  }

  /**
   * Load blocks from database into memory cache (call on startup)
   */
  public async loadBlocksFromDB(): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (prisma.block) {
        const blocks = await prisma.block.findMany();
        for (const block of blocks) {
          this.cacheBlock(block.blockerId, block.blockedId);
        }
        console.log(`Loaded ${blocks.length} blocks into memory cache`);
      }
    } catch (err) {
      console.warn('Failed to load blocks from DB:', (err as any)?.message);
    }
  }

  /**
   * Load skip history from database into memory cache (call on startup)
   */
  public async loadSkipHistoryFromDB(): Promise<void> {
    try {
      const prisma: any = getPrismaClient();
      if (prisma.skipHistory) {
        const skips = await prisma.skipHistory.findMany();
        for (const skip of skips) {
          let skipSet = this.skipCache.get(skip.userId);
          if (!skipSet) {
            skipSet = new Set();
            this.skipCache.set(skip.userId, skipSet);
          }
          skipSet.add(skip.skippedId);
        }
        console.log(`Loaded ${skips.length} skip records into memory cache`);
      }
    } catch (err) {
      console.warn('Failed to load skip history from DB:', (err as any)?.message);
    }
  }
}

export const privacyService = new PrivacyService();
