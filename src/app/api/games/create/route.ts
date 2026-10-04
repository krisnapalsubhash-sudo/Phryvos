import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPrismaClient } from '@/lib/db/prisma';
import {
  CreateGameRequest,
  CreateGameResponse,
  GameRoom,
  GameParticipant,
  GAME_VALIDATORS,
  createInitialGameState,
  getGameConfig
} from '@/lib/games';
import { realtimeEngine } from '@/lib/realtime/engine';

const prisma = getPrismaClient();

const USER_PUBLIC_FIELDS = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  bio: true,
  location: true,
  interests: true,
  followers: true,
  following: true,
  postsCount: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
};

// In-memory game rooms (in production, use Redis)
const gameRooms = new Map<string, GameRoom>();

function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function serializeGameRoom(room: GameRoom): string {
  return JSON.stringify({
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    startedAt: room.startedAt?.toISOString(),
    finishedAt: room.finishedAt?.toISOString(),
    participants: room.participants.map(p => ({
      ...p,
      joinedAt: p.joinedAt.toISOString(),
    })),
    moveHistory: room.moveHistory.map(m => ({
      ...m,
      timestamp: m.timestamp,
    })),
  });
}

function deserializeGameRoom(serialized: string): GameRoom {
  const data = JSON.parse(serialized);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
    finishedAt: data.finishedAt ? new Date(data.finishedAt) : undefined,
    participants: data.participants.map((p: any) => ({
      ...p,
      joinedAt: new Date(p.joinedAt),
    })),
    moveHistory: data.moveHistory.map((m: any) => ({
      ...m,
      timestamp: m.timestamp,
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gameType, config, mode, friendId } = body as CreateGameRequest;

    // Validate game type
    if (!gameType || !GAME_VALIDATORS[gameType]) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const gameConfig = getGameConfig(gameType);
    const mergedConfig = { ...gameConfig, ...config };

    // Check player count
    if (mode === 'friend' && !friendId) {
      return NextResponse.json({ error: 'friendId required for friend mode' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: USER_PUBLIC_FIELDS,
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create participants
    const participants: GameParticipant[] = [
      {
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        color: gameType === 'chess' ? 'white' : (gameType === 'ludo' ? 'red' : undefined),
        isReady: true,
        joinedAt: new Date(),
      },
    ];

    let secondParticipant: GameParticipant | null = null;

    if (mode === 'friend') {
      if (!friendId) {
        return NextResponse.json({ error: 'friendId is required for friend challenges' }, { status: 400 });
      }

      // Verify friend exists and is connected
      const friend = await prisma.user.findUnique({
        where: { id: friendId },
        select: USER_PUBLIC_FIELDS,
      });

      if (!friend) {
        return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
      }

      // Check if they're connected
      const connection = await prisma.connection.findUnique({
        where: {
          userId_connectedUserId: {
            userId: session.user.id,
            connectedUserId: friendId,
          },
        },
      });

      if (!connection) {
        return NextResponse.json({ error: 'You can only challenge connected friends' }, { status: 403 });
      }

      secondParticipant = {
        userId: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatar: friend.avatar,
        color: gameType === 'chess' ? 'black' : (gameType === 'ludo' ? 'blue' : undefined),
        isReady: false, // Friend needs to accept
        joinedAt: new Date(),
      };

      participants.push(secondParticipant);
    } else if (mode === 'bot') {
      // Add bot participant
      secondParticipant = {
        userId: 'bot',
        username: 'grandmaster_ai',
        displayName: 'Grandmaster AI 🤖',
        avatar: '🤖',
        color: gameType === 'chess' ? 'black' : (gameType === 'ludo' ? 'blue' : undefined),
        isReady: true,
        joinedAt: new Date(),
      };
      participants.push(secondParticipant);
    }
    // For 'stranger' mode, wait for matchmaking

    // Create initial game state
    const initialState = createInitialGameState(gameType, mergedConfig);

    const gameRoom: GameRoom = {
      id: generateGameId(),
      gameType,
      gameState: initialState,
      status: mode === 'stranger' ? 'WAITING' : 'ACTIVE',
      currentTurnPlayerId: participants[0].userId,
      moveHistory: [],
      config: mergedConfig,
      participants,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in memory
    gameRooms.set(gameRoom.id, gameRoom);

    // Register with realtime engine for stranger mode
    if (mode === 'stranger') {
      // Add to matchmaking queue via realtime engine
      // This would integrate with the existing matchmaking system
    }

    // If friend mode, create notification for friend
    if (secondParticipant && secondParticipant.userId !== 'bot') {
      await prisma.notification.create({
        data: {
          userId: secondParticipant.userId,
          actorId: session.user.id,
          type: 'GAME_CHALLENGE',
          title: 'Game Challenge',
          body: `${currentUser.displayName} challenged you to ${gameType}!`,
          data: JSON.stringify({ gameId: gameRoom.id, gameType }),
        },
      });
    }

    // Store in database for persistence
    const prismaAny: any = prisma;
    if (prismaAny.gameSession) {
      await prismaAny.gameSession.create({
        data: {
          id: gameRoom.id,
          gameType,
          gameState: serializeGameRoom(gameRoom),
          status: gameRoom.status,
          currentTurnPlayerId: gameRoom.currentTurnPlayerId,
          config: JSON.stringify(mergedConfig),
          participants: JSON.stringify(participants.map(p => p.userId)),
          createdAt: gameRoom.createdAt,
          updatedAt: gameRoom.updatedAt,
        },
      }).catch(() => {
        // GameSession model might not exist yet - graceful degradation
      });
    }

    return NextResponse.json({
      success: true,
      gameId: gameRoom.id,
      gameRoom: {
        ...gameRoom,
        createdAt: gameRoom.createdAt.toISOString(),
        updatedAt: gameRoom.updatedAt.toISOString(),
        participants: gameRoom.participants.map(p => ({
          ...p,
          joinedAt: p.joinedAt.toISOString(),
        })),
      },
    } as unknown as CreateGameResponse);
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active games for user
    const userGames = Array.from(gameRooms.values()).filter(room =>
      room.participants.some(p => p.userId === session.user.id) &&
      (room.status === 'ACTIVE' || room.status === 'WAITING')
    );

    return NextResponse.json({
      success: true,
      games: userGames.map(room => ({
        ...room,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
        startedAt: room.startedAt?.toISOString(),
        finishedAt: room.finishedAt?.toISOString(),
        participants: room.participants.map(p => ({
          ...p,
          joinedAt: p.joinedAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}