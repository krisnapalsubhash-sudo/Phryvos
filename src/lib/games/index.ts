export * from './types';
import { ticTacToeValidator } from './tictactoe/validator';
import { ludoValidator } from './ludo/validator';
import { chessValidator } from './chess/validator';
import { triviaValidator } from './trivia/validator';
import { wordMysteryValidator } from './wordmystery/validator';
import { GameValidator, GameType, GameRoom, GameConfig } from './types';

export const GAME_VALIDATORS: Record<GameType, GameValidator> = {
  tictactoe: ticTacToeValidator,
  ludo: ludoValidator,
  chess: chessValidator,
  trivia: triviaValidator,
  wordmystery: wordMysteryValidator,
};

export function getValidator(gameType: GameType): GameValidator {
  const validator = GAME_VALIDATORS[gameType];
  if (!validator) {
    throw new Error(`No validator found for game type: ${gameType}`);
  }
  return validator;
}

export function createInitialGameState(gameType: GameType, config?: GameConfig) {
  const validator = getValidator(gameType);
  return validator.getInitialState(config);
}

export function validateGameMove(
  gameRoom: GameRoom,
  playerId: string,
  action: string,
  payload: any
) {
  const validator = getValidator(gameRoom.gameType);
  return validator.validateMove(gameRoom, playerId, action, payload);
}

export function checkGameOver(gameRoom: GameRoom) {
  const validator = getValidator(gameRoom.gameType);
  return validator.checkGameOver(gameRoom.gameState);
}

// Game configurations
export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  tictactoe: {
    maxPlayers: 2,
    turnTimeLimit: 30,
  },
  ludo: {
    maxPlayers: 2,
    turnTimeLimit: 30,
  },
  chess: {
    maxPlayers: 2,
    turnTimeLimit: 180, // 3 min blitz
    gameDurationLimit: 360, // 6 min total
    variant: 'blitz',
  },
  trivia: {
    maxPlayers: 8,
    turnTimeLimit: 20,
    gameDurationLimit: 600, // 10 min
  },
  wordmystery: {
    maxPlayers: 2,
    turnTimeLimit: 30,
  },
};

export function getGameConfig(gameType: GameType): GameConfig {
  return GAME_CONFIGS[gameType] || { maxPlayers: 2 };
}

// Game metadata for UI
export const GAME_METADATA: Record<GameType, {
  title: string;
  emoji: string;
  category: string;
  players: string;
  description: string;
  color: string;
}> = {
  tictactoe: {
    title: 'Neon Tic-Tac-Toe',
    emoji: '⚔️',
    category: 'Instant • Laser Strike',
    players: '2 Players',
    description: 'Neon glowing 3x3 showdown with sound chord FX, score tracking, and bot AI.',
    color: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  },
  ludo: {
    title: 'Ludo Royal Stadium',
    emoji: '🎲',
    category: 'Race • 4-Bases & Knockouts',
    players: '2-4 Players',
    description: 'Roll animated 3D dice, knock rivals back to base, and sprint tokens home.',
    color: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
  },
  chess: {
    title: 'Fast Chess Arena',
    emoji: '♟️',
    category: 'Strategy • 3-Min Blitz',
    players: '2 Players',
    description: 'Rapid blitz chess with interactive piece moves, countdown clocks, and AI bot.',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  },
  trivia: {
    title: 'Trivia Orbit',
    emoji: '🎯',
    category: 'Party • Speed Rounds',
    players: '2-8 Players',
    description: 'Rapid-fire culture, science, geography, and curiosity speed duels.',
    color: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  },
  wordmystery: {
    title: 'Word Mystery',
    emoji: '🔤',
    category: 'Deduction • 20 Questions',
    players: '2 Players',
    description: 'Guess the secret word letter by letter with your partner.',
    color: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
  },
};