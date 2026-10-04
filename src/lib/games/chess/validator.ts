// Chess Game Validator - Server-side move validation
// Uses algebraic notation and basic move validation

import { GameValidator, ValidationResult, ChessGameState, ChessMovePayload, GameRoom, GameResult, GameMove } from '../types';

// Piece values for basic evaluation
const PIECE_VALUES: Record<string, number> = {
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100,
};

// File/rank helpers
const FILES = 'abcdefgh';
const RANKS = '12345678';

function squareToCoords(square: string): [number, number] | null {
  if (square.length !== 2) return null;
  const file = FILES.indexOf(square[0]);
  const rank = RANKS.indexOf(square[1]);
  if (file === -1 || rank === -1) return null;
  return [7 - rank, file]; // [row, col] with 0,0 = a8
}

function coordsToSquare(row: number, col: number): string {
  return FILES[col] + RANKS[7 - row];
}

function isValidSquare(square: string): boolean {
  return squareToCoords(square) !== null;
}

// Simplified move validation - in production, use a proper chess library like chess.js
export const chessValidator: GameValidator = {
  getInitialState() {
    return {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      castlingRights: 'KQkq',
      enPassantTarget: null,
      halfmoveClock: 0,
      fullmoveNumber: 1,
      whiteTime: 180,
      blackTime: 180,
      capturedWhite: [],
      capturedBlack: [],
      check: false,
      checkmate: false,
      stalemate: false,
      draw: false,
    } as ChessGameState;
  },

  serializeState(state: ChessGameState): string {
    return JSON.stringify(state);
  },

  deserializeState(serialized: string): ChessGameState {
    return JSON.parse(serialized);
  },

  checkGameOver(state: ChessGameState) {
    if (state.checkmate) {
      return {
        gameOver: true,
        result: state.turn === 'w' ? 'PLAYER2_WIN' : 'PLAYER1_WIN', // turn is side to move, so if white to move and checkmated, black wins
        winnerId: state.turn === 'w' ? 'player2' : 'player1',
      };
    }
    if (state.stalemate || state.draw) {
      return { gameOver: true, result: 'DRAW' };
    }
    return { gameOver: false };
  },

  validateMove(gameRoom: GameRoom, playerId: string, action: string, payload: any): ValidationResult {
    if (action !== 'move') {
      return { valid: false, error: 'Invalid action. Only "move" is allowed.' };
    }

    const movePayload = payload as ChessMovePayload;
    const { from, to, promotion } = movePayload;

    if (!from || !to || !isValidSquare(from) || !isValidSquare(to)) {
      return { valid: false, error: 'Invalid from/to squares. Use algebraic notation (e.g., "e2", "e4").' };
    }

    const state = this.deserializeState(gameRoom.gameState) as ChessGameState;

    if (state.checkmate || state.stalemate || state.draw) {
      return { valid: false, error: 'Game is already over.' };
    }

    // Check player turn
    const playerIndex = gameRoom.participants.findIndex(p => p.userId === playerId);
    if (playerIndex === -1) {
      return { valid: false, error: 'Player not in game.' };
    }

    const expectedColor = playerIndex === 0 ? 'w' : 'b';
    if (state.turn !== expectedColor) {
      return { valid: false, error: 'Not your turn.' };
    }

    // Basic move validation (simplified)
    // In production, use chess.js or similar for full legal move generation
    const validationResult = (chessValidator as any).validateChessMove(state, from, to, promotion);
    if (!validationResult.valid) {
      return validationResult;
    }

    // Apply move to FEN (simplified - just update turn and move counters)
    // Real implementation would update full FEN
    const newState: ChessGameState = {
      ...state,
      turn: state.turn === 'w' ? 'b' : 'w',
      fullmoveNumber: state.turn === 'b' ? state.fullmoveNumber + 1 : state.fullmoveNumber,
      halfmoveClock: state.halfmoveClock + 1,
      lastMove: { from, to, piece: '' }, // Would track actual piece
    };

    // Check for game over (simplified)
    const gameOver = false; // Would check checkmate/stalemate
    let result: GameResult | undefined;
    let winnerId: string | undefined;

    const move: GameMove = {
      moveId: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      playerId,
      turnNumber: state.fullmoveNumber,
      action: 'move',
      payload: { from, to, promotion, san: movePayload.san || `${from}${to}` },
      timestamp: new Date().toISOString(),
      validated: true,
    };

    return {
      valid: true,
      newState,
      move,
      gameOver,
      result,
      winnerId,
    };
  },

  // Simplified chess move validation
  validateChessMove(state: ChessGameState, from: string, to: string, promotion?: string): ValidationResult {
    // Parse current position from FEN (simplified)
    // In production, use a proper chess library

    // Basic checks
    if (from === to) {
      return { valid: false, error: 'From and to squares cannot be the same.' };
    }

    // Validate promotion
    if (promotion && !['q', 'r', 'b', 'n'].includes(promotion)) {
      return { valid: false, error: 'Invalid promotion piece. Must be q, r, b, or n.' };
    }

    // For MVP, accept all syntactically valid moves
    // Full validation requires chess.js or similar
    return { valid: true };
  },
};