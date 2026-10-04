import { getPrismaClient } from '@/lib/db/prisma';

export class NotificationService {
  /**
   * Create an in-app notification
   */
  public async createNotification(data: {
    userId: string;
    actorId?: string;
    type: 'LIKE' | 'COMMENT' | 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'SYSTEM';
    title: string;
    body: string;
    metadata?: any;
  }) {
    // Don't notify self
    if (data.actorId && data.actorId === data.userId) return null;

    const prisma = getPrismaClient();

    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          actorId: data.actorId || null,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.metadata ? JSON.stringify(data.metadata) : null,
          isRead: false,
        },
      });
    } catch (err) {
      console.warn('Notification insert deferred:', (err as any)?.message);
      return null;
    }
  }

  /**
   * Query user notifications with indexed sorting and unread filtering
   */
  public async getNotifications(userId: string, options: { limit?: number; unreadOnly?: boolean } = {}) {
    const prisma = getPrismaClient();
    const limit = options.limit || 20;

    const where: any = { userId };
    if (options.unreadOnly) {
      where.isRead = false;
    }

    try {
      const [items, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return { notifications: items, unreadCount };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string, userId: string) {
    const prisma = getPrismaClient();
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string) {
    const prisma = getPrismaClient();
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const notificationService = new NotificationService();
