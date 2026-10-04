import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

interface InMemAppeal {
  id: string;
  userId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatorResponse?: string;
  reviewedBy?: string;
  createdAt: string;
}

const memoryAppeals: InMemAppeal[] = [];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let appeals = [...memoryAppeals];

    try {
      const prisma = getPrismaClient();
      if (prisma.moderationAppeal) {
        const dbAppeals = await prisma.moderationAppeal.findMany({
          where: status ? { status } : undefined,
          orderBy: { createdAt: 'desc' },
        });

        if (dbAppeals && dbAppeals.length > 0) {
          const ids = new Set(appeals.map((a) => a.id));
          for (const dba of dbAppeals) {
            if (!ids.has(dba.id)) {
              appeals.push({
                id: dba.id,
                userId: dba.userId,
                reason: dba.reason,
                status: dba.status as any,
                moderatorResponse: dba.moderatorResponse || undefined,
                reviewedBy: dba.reviewedBy || undefined,
                createdAt: dba.createdAt.toISOString(),
              });
            }
          }
        }
      }
    } catch {}

    if (status) {
      appeals = appeals.filter((a) => a.status === status);
    }

    return NextResponse.json({ success: true, total: appeals.length, appeals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch appeals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'SUBMIT', appealId, userId, reason, decision, moderatorResponse, moderatorId } = body;

    if (action === 'SUBMIT') {
      if (!userId || !reason) {
        return NextResponse.json({ error: 'Missing userId or reason for appeal' }, { status: 400 });
      }

      const newAppeal: InMemAppeal = {
        id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        reason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      memoryAppeals.unshift(newAppeal);

      try {
        const prisma = getPrismaClient();
        if (prisma.moderationAppeal) {
          await prisma.moderationAppeal.create({
            data: {
              userId,
              reason,
              status: 'PENDING',
            },
          });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Appeal submitted successfully. Review will be conducted within 24 hours.',
        appeal: newAppeal,
      });
    }

    if (action === 'RESOLVE') {
      if (!appealId || !decision) {
        return NextResponse.json({ error: 'Missing appealId or decision' }, { status: 400 });
      }

      const appeal = memoryAppeals.find((a) => a.id === appealId);
      if (appeal) {
        appeal.status = decision;
        appeal.moderatorResponse = moderatorResponse;
        appeal.reviewedBy = moderatorId;
      }

      try {
        const prisma = getPrismaClient();
        if (prisma.moderationAppeal) {
          await prisma.moderationAppeal.updateMany({
            where: { id: appealId },
            data: {
              status: decision,
              moderatorResponse,
              reviewedBy: moderatorId,
            },
          });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Appeal marked as ${decision}.`,
        appeal,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process appeal' }, { status: 500 });
  }
}
