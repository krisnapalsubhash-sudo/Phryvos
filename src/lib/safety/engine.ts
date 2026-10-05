// Multi-layer Enterprise Safety & Moderation Engine for Phryvos
// Enforces:
// 1. Multi-dimensional Throttling (User, IP, Room) with spam escalation
// 2. Persistent Prisma Block & Report integration with zero-latency caching
// 3. Minor-Adult protection & Grooming pattern detection
// 4. Anti-abuse report queue with evidence preservation and appeals workflow
// 5. Intelligent severity grading (Low, Medium, High, Critical Imminent Harm)

import { getPrismaClient } from '@/lib/db/prisma';
import { contentModerationService, type ContentModerationResult } from './contentModeration';
import { privacyService } from './privacyService';

interface RateLimitTracker {
  count: number;
  resetAt: number;
  violationsCount?: number;
}

export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_IMMINENT_HARM';
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface ModerationIncident {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  category: string;
  severity: ReportSeverity;
  status: ReportStatus;
  evidenceSnippet?: string;
  moderatorNotes?: string;
  actionTaken?: string;
  timestamp: string;
}

export interface UserSafetyRecord {
  blockedUserIds: Set<string>;
  reportsReceivedCount: number;
  isTemporarilyFrozen: boolean;
  frozenUntil?: number;
  warnings: string[];
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterMs?: number;
  reason?: string;
  scope?: 'user' | 'ip' | 'room';
}

export class SafetyEngine {
  private rateLimits: Map<string, RateLimitTracker> = new Map();
  private userSafetyMap: Map<string, UserSafetyRecord> = new Map();
  private reportsQueue: ModerationIncident[] = [];
  private recentReportsByReporter: Map<string, Array<{ targetId: string; timestamp: number }>> = new Map();

  private getSafetyRecord(userId: string): UserSafetyRecord {
    let record = this.userSafetyMap.get(userId);
    if (!record) {
      record = {
        blockedUserIds: new Set(),
        reportsReceivedCount: 0,
        isTemporarilyFrozen: false,
        warnings: [],
      };
      this.userSafetyMap.set(userId, record);
    }
    return record;
  }

  // Multi-dimensional Rate Limiting with Spam Penalty Escalation
  public checkRateLimit(
    arg: string | { userId: string; clientIp?: string; roomId?: string }
  ): RateLimitCheckResult {
    const { userId, clientIp, roomId } = typeof arg === 'string' ? { userId: arg } : arg;
    const now = Date.now();

    // Check if user is temporarily frozen due to critical safety incident
    const record = this.getSafetyRecord(userId);
    if (record.isTemporarilyFrozen && record.frozenUntil && now < record.frozenUntil) {
      const waitSec = Math.ceil((record.frozenUntil - now) / 1000);
      return {
        allowed: false,
        retryAfterMs: record.frozenUntil - now,
        reason: `Account is temporarily paused for review (${waitSec}s remaining).`,
        scope: 'user',
      };
    }

    // Phase 60: Memory leak prevention - reclaim expired rate limit entries
    if (this.rateLimits.size > 1000) {
      for (const [k, tracker] of this.rateLimits.entries()) {
        if (now > tracker.resetAt) {
          this.rateLimits.delete(k);
        }
      }
    }

    const checks: Array<{ key: string; limit: number; windowMs: number; scope: 'user' | 'ip' | 'room' }> = [
      { key: `user:${userId}`, limit: 8, windowMs: 4000, scope: 'user' },
    ];

    if (roomId) {
      checks.push({ key: `room:${roomId}`, limit: 15, windowMs: 4000, scope: 'room' });
    }

    if (clientIp && clientIp !== 'unknown-ip' && clientIp !== '127.0.0.1') {
      checks.push({ key: `ip:${clientIp}`, limit: 25, windowMs: 4000, scope: 'ip' });
    }

    for (const check of checks) {
      let tracker = this.rateLimits.get(check.key);

      if (!tracker || now > tracker.resetAt) {
        tracker = {
          count: 0,
          resetAt: now + check.windowMs,
          violationsCount: tracker?.violationsCount || 0,
        };
        this.rateLimits.set(check.key, tracker);
      }

      if (tracker.count >= check.limit) {
        const violations = (tracker.violationsCount || 0) + 1;
        tracker.violationsCount = violations;

        const penaltyMultiplier = Math.min(violations, 5);
        const penaltyMs = (tracker.resetAt - now) * penaltyMultiplier;

        return {
          allowed: false,
          retryAfterMs: Math.max(1000, penaltyMs),
          reason: `Rate limit exceeded on ${check.scope}. Please slow down.`,
          scope: check.scope,
        };
      }

      tracker.count += 1;
    }

    return { allowed: true };
  }

  // Content Filtering, Profanity Masking & Grooming Detection
  public sanitizeMessage(text: string, isMinor: boolean = false): {
    cleanText: string;
    isToxic: boolean;
    moderation: ContentModerationResult;
  } {
    const moderation = contentModerationService.analyzeText(text, isMinor);
    return {
      cleanText: moderation.cleanText,
      isToxic: moderation.isToxic,
      moderation,
    };
  }

  private normalizeReportReason(reason?: string, category?: string): 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'FAKE_PROFILE' | 'SCAM' | 'OTHER' {
    const combined = `${category || ''} ${reason || ''}`.toUpperCase();
    if (combined.includes('SPAM') || combined.includes('BOT')) return 'SPAM';
    if (combined.includes('HARASS') || combined.includes('BULLY') || combined.includes('THREAT') || combined.includes('HATE')) return 'HARASSMENT';
    if (combined.includes('INAPPROPRIATE') || combined.includes('NUDE') || combined.includes('NSFW') || combined.includes('CSAM') || combined.includes('CHILD')) return 'INAPPROPRIATE_CONTENT';
    if (combined.includes('FAKE') || combined.includes('IMPERSONAT')) return 'FAKE_PROFILE';
    if (combined.includes('SCAM') || combined.includes('PHISH') || combined.includes('FRAUD')) return 'SCAM';
    return 'OTHER';
  }

  // Persistent Bidirectional Block (Audit #11: reliable persistence, no hidden errors)
  public async blockUser(sourceUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    if (!sourceUserId || !targetUserId || sourceUserId === targetUserId) {
      return { success: false, error: 'Cannot block invalid user' };
    }
    const record = this.getSafetyRecord(sourceUserId);
    record.blockedUserIds.add(targetUserId);

    const isCallerGuest = /^(anon|guest)[-_]/i.test(sourceUserId);
    const isTargetGuest = /^(anon|guest)[-_]/i.test(targetUserId);

    if (isCallerGuest || isTargetGuest) {
      return { success: true };
    }

    try {
      const persisted = await privacyService.blockUser(sourceUserId, targetUserId);
      if (!persisted) {
        return { success: false, error: 'Database block persistence failed' };
      }
      return { success: true };
    } catch (err: any) {
      console.error('SafetyEngine blockUser DB error:', err);
      return { success: false, error: err?.message || 'Database block error' };
    }
  }

  public isUserBlocked(sourceUserId: string, targetUserId: string): boolean {
    return privacyService.isBlockedSync(sourceUserId, targetUserId) === 'BLOCKED';
  }

  // Report user with anti-abuse validation & awaited persistence (Audit #10 & #12)
  public async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    options?: {
      category?: string;
      evidenceContext?: string;
      isMinorInvolved?: boolean;
    }
  ): Promise<ModerationIncident & { error?: string }> {
    const now = Date.now();

    // 0. Prevent Self-Report
    if (reporterId === reportedUserId) {
      return {
        id: `self-${now}`,
        reporterId,
        reportedUserId,
        reason,
        category: 'SELF_REPORT',
        severity: 'LOW',
        status: 'DISMISSED',
        actionTaken: 'SELF_REPORT_REJECTED',
        timestamp: new Date().toISOString(),
        error: 'Cannot report yourself.',
      };
    }

    // 1. Anti-Abuse / Malicious Reporting Filter
    let reporterHistory = this.recentReportsByReporter.get(reporterId) || [];
    reporterHistory = reporterHistory.filter((r) => now - r.timestamp < 3600000);

    // Check duplicate report on same user within 15 minutes
    const duplicate = reporterHistory.find(
      (r) => r.targetId === reportedUserId && now - r.timestamp < 900000
    );
    if (duplicate) {
      await this.blockUser(reporterId, reportedUserId);
      return {
        id: `dup-${now}`,
        reporterId,
        reportedUserId,
        reason,
        category: 'DUPLICATE_REPORT',
        severity: 'LOW',
        status: 'DISMISSED',
        actionTaken: 'DUPLICATE_REPORT_INTERCEPTED',
        timestamp: new Date().toISOString(),
        error: 'Report already received and queued for review.',
      };
    }

    // Rate-limit reporter: max 5 reports per hour
    if (reporterHistory.length >= 5) {
      return {
        id: `rate-${now}`,
        reporterId,
        reportedUserId,
        reason,
        category: 'RATE_LIMITED',
        severity: 'LOW',
        status: 'DISMISSED',
        actionTaken: 'RATE_LIMIT_REJECTED',
        timestamp: new Date().toISOString(),
        error: 'Report submission limit reached. Please wait.',
      };
    }

    reporterHistory.push({ targetId: reportedUserId, timestamp: now });
    this.recentReportsByReporter.set(reporterId, reporterHistory);

    // 2. Intelligent Severity Triage
    let severity: ReportSeverity = 'MEDIUM';
    const reasonLower = (reason + ' ' + (options?.evidenceContext || '')).toLowerCase();

    if (
      reasonLower.includes('child') ||
      reasonLower.includes('minor') ||
      reasonLower.includes('groom') ||
      reasonLower.includes('csam') ||
      reasonLower.includes('kill') ||
      reasonLower.includes('suicide')
    ) {
      severity = 'CRITICAL_IMMINENT_HARM';
    } else if (
      reasonLower.includes('nude') ||
      reasonLower.includes('harass') ||
      reasonLower.includes('threat') ||
      options?.isMinorInvolved
    ) {
      severity = 'HIGH';
    } else if (reasonLower.includes('spam') || reasonLower.includes('bot')) {
      severity = 'LOW';
    }

    // Auto-block reported user from reporter's orbit
    await this.blockUser(reporterId, reportedUserId);

    let dbReportId: string | undefined;
    const isCallerGuest = /^(anon|guest)[-_]/i.test(reporterId);
    const isTargetGuest = /^(anon|guest)[-_]/i.test(reportedUserId);

    // 3. Awaited Persistence to PostgreSQL Report model for registered users (Audit #12)
    if (!isCallerGuest && !isTargetGuest) {
      try {
        const prisma = getPrismaClient();
        if (prisma.report) {
          const reportReason = this.normalizeReportReason(reason, options?.category);
          const dbReport = await prisma.report.create({
            data: {
              reporterId,
              reportedId: reportedUserId,
              reason: reportReason,
              description: reason,
              status: 'PENDING',
              severity,
              evidence: options?.evidenceContext || null,
            },
          });
          dbReportId = dbReport.id;
        }
      } catch (err: any) {
        console.error('SafetyEngine reportUser DB persistence error:', err);
        return {
          id: `err-${now}`,
          reporterId,
          reportedUserId,
          reason,
          category: options?.category || 'GENERAL_SAFETY',
          severity,
          status: 'DISMISSED',
          timestamp: new Date().toISOString(),
          error: 'Failed to record report in safety database.',
        };
      }
    }

    const incident: ModerationIncident = {
      id: dbReportId || `rep-${now}-${Math.random().toString(36).substring(2, 6)}`,
      reporterId,
      reportedUserId,
      reason,
      category: options?.category || 'GENERAL_SAFETY',
      severity,
      status: 'PENDING',
      evidenceSnippet: options?.evidenceContext,
      timestamp: new Date().toISOString(),
    };

    this.reportsQueue.push(incident);

    // 4. Critical Escalation: Freeze chronic or severe predatory threats temporarily
    const targetRecord = this.getSafetyRecord(reportedUserId);
    targetRecord.reportsReceivedCount += 1;

    if (severity === 'CRITICAL_IMMINENT_HARM') {
      targetRecord.isTemporarilyFrozen = true;
      targetRecord.frozenUntil = now + 3600000;

      if (!isTargetGuest) {
        try {
          const prisma = getPrismaClient();
          await prisma.user.update({
            where: { id: reportedUserId },
            data: {
              isSuspended: true,
              suspendedUntil: new Date(now + 3600000),
            },
          });
        } catch {}
      }
    }

    return incident;
  }

  // Get reports queue backed by database as single source of truth (Audit #10)
  public async getReportsQueue(filter?: {
    status?: ReportStatus;
    severity?: ReportSeverity;
    limit?: number;
  }): Promise<ModerationIncident[]> {
    const limit = filter?.limit || 50;
    const reports: ModerationIncident[] = [];

    try {
      const prisma = getPrismaClient();
      if (prisma.report) {
        const dbReports = await prisma.report.findMany({
          where: {
            status: filter?.status ? filter.status : undefined,
            severity: filter?.severity ? filter.severity : undefined,
          },
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: {
            reporter: { select: { id: true, username: true, displayName: true } },
            reportedUser: { select: { id: true, username: true, displayName: true } },
          },
        });

        for (const dbr of dbReports) {
          reports.push({
            id: dbr.id,
            reporterId: dbr.reporterId,
            reportedUserId: dbr.reportedId,
            reason: dbr.description || dbr.reason,
            category: dbr.reason,
            severity: (dbr.severity as ReportSeverity) || 'MEDIUM',
            status: (dbr.status as ReportStatus) || 'PENDING',
            evidenceSnippet: dbr.evidence || undefined,
            actionTaken: dbr.actionTaken || undefined,
            moderatorNotes: dbr.moderatorNotes || undefined,
            timestamp: dbr.createdAt.toISOString(),
          });
        }
      }
    } catch (dbErr) {
      console.warn('Database reports queue query deferred:', (dbErr as any)?.message);
    }

    // Merge in-memory queue for any pending incidents not in DB
    const existingIds = new Set(reports.map((r) => r.id));
    for (const memIncident of this.reportsQueue) {
      if (!existingIds.has(memIncident.id)) {
        if (filter?.status && memIncident.status !== filter.status) continue;
        if (filter?.severity && memIncident.severity !== filter.severity) continue;
        reports.push(memIncident);
      }
    }

    return reports.slice(0, limit);
  }

  public async getReports(): Promise<ModerationIncident[]> {
    return this.getReportsQueue();
  }

  // Moderator actions on report with durable DB transactions (Audit #10)
  public async takeModeratorAction(
    reportId: string,
    action: 'WARNING_ISSUED' | 'TEMPORARY_SUSPENSION' | 'PERMANENT_BAN' | 'DISMISSED',
    moderatorNotes: string,
    moderatorId: string
  ): Promise<{ success: boolean; incident?: ModerationIncident; error?: string }> {
    const prisma = getPrismaClient();
    let dbReport: any = null;

    try {
      if (prisma.report) {
        dbReport = await prisma.report.findUnique({
          where: { id: reportId },
        });
      }
    } catch {}

    const memIncident = this.reportsQueue.find((r) => r.id === reportId);
    if (!dbReport && !memIncident) {
      return { success: false, error: 'Report not found in database or active queue' };
    }

    const reportedUserId = dbReport?.reportedId || memIncident?.reportedUserId;

    // 1. Transactionally update DB
    try {
      if (prisma.report && dbReport) {
        await prisma.$transaction(async (tx) => {
          await tx.report.update({
            where: { id: reportId },
            data: {
              status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED',
              actionTaken: action,
              moderatorNotes,
              resolvedAt: new Date(),
            },
          });

          if (reportedUserId) {
            if (action === 'PERMANENT_BAN') {
              await tx.user.update({
                where: { id: reportedUserId },
                data: {
                  isBanned: true,
                  banReason: moderatorNotes || 'Banned by moderator',
                },
              });
              await tx.session.deleteMany({ where: { userId: reportedUserId } });
            } else if (action === 'TEMPORARY_SUSPENSION') {
              const suspendedUntil = new Date(Date.now() + 7 * 86400000);
              await tx.user.update({
                where: { id: reportedUserId },
                data: {
                  isSuspended: true,
                  suspendedUntil,
                },
              });
              await tx.session.deleteMany({ where: { userId: reportedUserId } });
            } else if (action === 'DISMISSED') {
              await tx.user.update({
                where: { id: reportedUserId },
                data: {
                  isSuspended: false,
                  suspendedUntil: null,
                },
              });
            }
          }

          if (tx.moderationAuditLog) {
            await tx.moderationAuditLog.create({
              data: {
                moderatorId,
                action,
                targetUserId: reportedUserId || null,
                reportId,
                details: JSON.stringify({ moderatorNotes, timestamp: new Date().toISOString() }),
              },
            });
          }
        });
      }
    } catch (err: any) {
      console.error('Moderation action persistence failed:', err);
      return { success: false, error: 'Failed to persist moderation action in database' };
    }

    // 2. Update in-memory state
    if (memIncident) {
      memIncident.status = action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
      memIncident.actionTaken = action;
      memIncident.moderatorNotes = moderatorNotes;
    }

    if (reportedUserId) {
      const targetRecord = this.getSafetyRecord(reportedUserId);
      if (action === 'WARNING_ISSUED') {
        targetRecord.warnings.push(`Warning issued on ${new Date().toISOString()}: ${moderatorNotes}`);
      } else if (action === 'TEMPORARY_SUSPENSION') {
        targetRecord.isTemporarilyFrozen = true;
        targetRecord.frozenUntil = Date.now() + 7 * 86400000;
      } else if (action === 'PERMANENT_BAN') {
        targetRecord.isTemporarilyFrozen = true;
        targetRecord.frozenUntil = Date.now() + 365 * 86400000 * 10;
      } else if (action === 'DISMISSED') {
        targetRecord.isTemporarilyFrozen = false;
        targetRecord.frozenUntil = undefined;
      }
    }

    const incident: ModerationIncident = memIncident || {
      id: reportId,
      reporterId: dbReport.reporterId,
      reportedUserId,
      reason: dbReport.description || dbReport.reason,
      category: dbReport.reason,
      severity: dbReport.severity,
      status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED',
      evidenceSnippet: dbReport.evidence || undefined,
      actionTaken: action,
      moderatorNotes,
      timestamp: dbReport.createdAt.toISOString(),
    };

    return { success: true, incident };
  }
}

declare global {
  var __phryvos_safety_engine__: SafetyEngine | undefined;
}

export const safetyEngine =
  globalThis.__phryvos_safety_engine__ ||
  (globalThis.__phryvos_safety_engine__ = new SafetyEngine());
