import { getPrismaClient } from '@/lib/db/prisma';
import { privacyService } from '@/lib/safety/privacyService';
import type { MessageType } from '@prisma/client';

export class ConversationService {
  /**
   * Find existing conversation between two users or create a new one
   */
  public async getOrCreateConversation(userAId: string, userBId: string) {
    if (userAId === userBId) return null;

    // Check block status
    const blocked = await privacyService.isBlocked(userAId, userBId);
    if (blocked) return null;

    const prisma = getPrismaClient();
    const directKey = [userAId, userBId].sort().join(':');

    // Look for conversation where both are participants using unique directKey
    let existing = await prisma.conversation.findUnique({
      where: { directKey },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      existing = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: userAId } } },
            { participants: { some: { userId: userBId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                },
              },
            },
          },
        },
      });
    }

    if (existing) return existing;

    // Create new conversation with participants and unique directKey
    try {
      return await prisma.conversation.create({
        data: {
          directKey,
          participants: {
            create: [{ userId: userAId }, { userId: userBId }],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                },
              },
            },
          },
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const raceConv = await prisma.conversation.findUnique({
          where: { directKey },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    isOnline: true,
                  },
                },
              },
            },
          },
        });
        if (raceConv) return raceConv;
      }
      throw err;
    }
  }

  /**
   * Send a direct message with block protection and conversation timestamp update
   */
  public async sendMessage(data: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type?: MessageType;
    clientMessageId?: string;
  }) {
    // Check block status
    const blocked = await privacyService.isBlocked(data.senderId, data.receiverId);
    if (blocked) {
      throw new Error('Message cannot be sent to blocked user.');
    }

    const prisma = getPrismaClient();

    // If clientMessageId provided, check for idempotent duplicate
    if (data.clientMessageId) {
      const existing = await prisma.message.findUnique({
        where: { clientMessageId: data.clientMessageId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });
      if (existing) return existing;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            type: data.type || 'TEXT',
            clientMessageId: data.clientMessageId,
            isRead: false,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        });

        // Update conversation updatedAt for sorting inbox
        await tx.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        return message;
      });
    } catch (err: any) {
      if (data.clientMessageId && err?.code === 'P2002') {
        const existing = await prisma.message.findUnique({
          where: { clientMessageId: data.clientMessageId },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  /**
   * Fetch conversation messages using composite index and stable cursor pagination
   */
  public async getMessages(conversationId: string, limit: number = 30, cursor?: string) {
    const prisma = getPrismaClient();

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = messages;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id || null;
    }

    // Mask deleted messages
    const sanitizedItems = items.map((msg) => ({
      ...msg,
      content: msg.isDeleted ? 'This message was deleted' : msg.content,
    }));

    // Return in chronological ascending order for UI chat display
    return {
      messages: sanitizedItems.reverse(),
      nextCursor,
    };
  }

  /**
   * Query unread messages count using [receiverId, isRead] index
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const prisma = getPrismaClient();
    return await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark all messages in a conversation as read for the user atomically
   */
  public async markConversationRead(conversationId: string, userId: string) {
    const prisma = getPrismaClient();
    const readTimestamp = new Date();

    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: { lastReadAt: readTimestamp },
      }),
    ]);
  }
}

export const conversationService = new ConversationService();
