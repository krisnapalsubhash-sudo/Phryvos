import { getPrismaClient } from '@/lib/db/prisma';
import { privacyService } from '@/lib/safety/privacyService';

export class ConnectionService {
  /**
   * Atomic connection creation with followers/following increment
   */
  public async connectUsers(userId: string, targetUserId: string): Promise<boolean> {
    if (userId === targetUserId) return false;

    // Block check
    const isBlocked = await privacyService.isBlocked(userId, targetUserId);
    if (isBlocked) return false;

    const prisma = getPrismaClient();

    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.connection.findUnique({
          where: {
            userId_connectedUserId: {
              userId,
              connectedUserId: targetUserId,
            },
          },
        });

        if (existing) return true; // Idempotent

        await tx.connection.create({
          data: {
            userId,
            connectedUserId: targetUserId,
          },
        });

        // Atomic counters update
        await tx.user.update({
          where: { id: userId },
          data: { following: { increment: 1 } },
        });

        await tx.user.update({
          where: { id: targetUserId },
          data: { followers: { increment: 1 } },
        });

        return true;
      });
    } catch {
      return false;
    }
  }

  /**
   * Atomic disconnect with followers/following decrement
   */
  public async disconnectUsers(userId: string, targetUserId: string): Promise<boolean> {
    const prisma = getPrismaClient();

    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.connection.findUnique({
          where: {
            userId_connectedUserId: {
              userId,
              connectedUserId: targetUserId,
            },
          },
        });

        if (!existing) return true;

        await tx.connection.delete({
          where: { id: existing.id },
        });

        await tx.user.update({
          where: { id: userId },
          data: { following: { decrement: 1 } },
        });

        await tx.user.update({
          where: { id: targetUserId },
          data: { followers: { decrement: 1 } },
        });

        return true;
      });
    } catch {
      return false;
    }
  }

  /**
   * Reconcile followers and following derived counts
   */
  public async reconcileFollowerCounts(userId: string) {
    const prisma = getPrismaClient();

    const [actualFollowing, actualFollowers] = await Promise.all([
      prisma.connection.count({ where: { userId } }),
      prisma.connection.count({ where: { connectedUserId: userId } }),
    ]);

    await prisma.user.update({
      where: { id: userId },
      data: {
        following: actualFollowing,
        followers: actualFollowers,
      },
    });

    return { following: actualFollowing, followers: actualFollowers };
  }
}

export const connectionService = new ConnectionService();
