// Ludo Game Validator - Server-side move validation

import { GameValidator, ValidationResult, LudoGameState, LudoMovePayload, GameRoom, GameResult, GameMove, LudoToken } from '../types';

const BOARD_SIZE = 52; // Main track positions 0-51
const HOME_STRETCH_SIZE = 6; // Positions 52-57
const FINISH_POSITION = 58;
const BASE_POSITION = -1;
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe squares (including starts)

export const ludoValidator: GameValidator = {
  getInitialState() {
    return {
      board: Array(BOARD_SIZE).fill(null).map((_, i) => ({
        index: i,
        type: SAFE_POSITIONS.includes(i) ? 'safe' : 'main',
      })),
      redTokens: [
        { id: 'r1', color: 'red', position: BASE_POSITION },
        { id: 'r2', color: 'red', position: BASE_POSITION },
        { id: 'r3', color: 'red', position: BASE_POSITION },
        { id: 'r4', color: 'red', position: BASE_POSITION },
      ],
      blueTokens: [
        { id: 'b1', color: 'blue', position: BASE_POSITION },
        { id: 'b2', color: 'blue', position: BASE_POSITION },
        { id: 'b3', color: 'blue', position: BASE_POSITION },
        { id: 'b4', color: 'blue', position: BASE_POSITION },
      ],
      currentPlayer: 'red',
      diceValue: 1,
      rollsRemaining: 0,
      turnNumber: 0,
    } as LudoGameState;
  },

  serializeState(state: LudoGameState): string {
    return JSON.stringify(state);
  },

  deserializeState(serialized: string): LudoGameState {
    return JSON.parse(serialized);
  },

  checkGameOver(state: LudoGameState) {
    if (state.winner) {
      return {
        gameOver: true,
        result: state.winner === 'red' ? 'PLAYER1_WIN' : 'PLAYER2_WIN',
        winnerId: state.winner === 'red' ? 'player1' : 'player2',
      };
    }
    return { gameOver: false };
  },

  validateMove(gameRoom: GameRoom, playerId: string, action: string, payload: any): ValidationResult {
    if (action !== 'moveToken') {
      return { valid: false, error: 'Invalid action. Only "moveToken" is allowed.' };
    }

    const movePayload = payload as LudoMovePayload;
    const { tokenId, diceValue } = movePayload;

    if (!tokenId || typeof diceValue !== 'number' || diceValue < 1 || diceValue > 6) {
      return { valid: false, error: 'Invalid tokenId or diceValue. Dice must be 1-6.' };
    }

    const state = this.deserializeState(gameRoom.gameState) as LudoGameState;

    if (state.winner) {
      return { valid: false, error: 'Game is already over.' };
    }

    // Find player index and color
    const playerIndex = gameRoom.participants.findIndex(p => p.userId === playerId);
    if (playerIndex === -1) {
      return { valid: false, error: 'Player not in game.' };
    }

    const playerColor = playerIndex === 0 ? 'red' : 'blue';
    if (state.currentPlayer !== playerColor) {
      return { valid: false, error: 'Not your turn.' };
    }

    // Validate dice value matches current state
    if (diceValue !== state.diceValue) {
      return { valid: false, error: 'Dice value mismatch. Server-authoritative dice.' };
    }

    // Find the token
    const tokens = playerColor === 'red' ? state.redTokens : state.blueTokens;
    const opponentTokens = playerColor === 'red' ? state.blueTokens : state.redTokens;
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);

    if (tokenIndex === -1) {
      return { valid: false, error: 'Token not found.' };
    }

    const token = tokens[tokenIndex];
    const currentPos = token.position;

    // Check if token can move
    if (currentPos === BASE_POSITION) {
      // Token in base - can only deploy on 1 or 6
      if (diceValue !== 1 && diceValue !== 6) {
        return { valid: false, error: 'Need 1 or 6 to deploy token from base.' };
      }
    } else if (currentPos >= FINISH_POSITION) {
      return { valid: false, error: 'Token already finished.' };
    }

    // Calculate new position
    let newPos = currentPos;

    if (currentPos === BASE_POSITION) {
      // Deploy to start position (0 for red, 26 for blue - opposite sides)
      newPos = playerColor === 'red' ? 0 : 26;
    } else {
      // Move along track
      newPos = Math.min(currentPos + diceValue, FINISH_POSITION);

      // Handle home stretch entry
      if (currentPos < BOARD_SIZE && newPos >= BOARD_SIZE) {
        const overshoot = newPos - BOARD_SIZE;
        if (overshoot > HOME_STRETCH_SIZE) {
          return { valid: false, error: 'Cannot overshoot home.' };
        }
        newPos = BOARD_SIZE + overshoot;
      }
    }

    // Check for knockout (landing on opponent token on non-safe square)
    let knockedOutTokenId: string | null = null;
    if (newPos < BOARD_SIZE && !SAFE_POSITIONS.includes(newPos)) {
      const opponentToken = opponentTokens.find(t => t.position === newPos);
      if (opponentToken) {
        knockedOutTokenId = opponentToken.id;
        opponentToken.position = BASE_POSITION;
      }
    }

    // Create new tokens array with updated position
    const newTokens = tokens.map((t, i) => i === tokenIndex ? { ...t, position: newPos } : t);

    // Check win condition
    const allFinished = newTokens.every(t => t.position >= FINISH_POSITION);
    let winner: 'red' | 'blue' | null = null;
    if (allFinished) {
      winner = playerColor;
    }

    // Determine next turn
    let nextPlayer: 'red' | 'blue' = playerColor;
    let rollsRemaining = state.rollsRemaining;

    if (diceValue === 6) {
      // Extra roll on 6
      rollsRemaining += 1;
    } else {
      // Switch player
      nextPlayer = playerColor === 'red' ? 'blue' : 'red';
      rollsRemaining = 0;
    }

    const newState: LudoGameState = {
      ...state,
      redTokens: playerColor === 'red' ? newTokens : state.redTokens,
      blueTokens: playerColor === 'blue' ? newTokens : state.blueTokens,
      currentPlayer: nextPlayer,
      diceValue: 1, // Will be set by next roll
      rollsRemaining,
      turnNumber: state.turnNumber + 1,
      winner,
    };

    const gameOver = !!winner;
    let result: GameResult | undefined;
    let winnerId: string | undefined;

    if (gameOver) {
      result = winner === 'red' ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
      winnerId = gameRoom.participants.find(p =>
        (winner === 'red' && p.color === 'red') || (winner === 'blue' && p.color === 'blue')
      )?.userId;
    }

    const move: GameMove = {
      moveId: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      playerId,
      turnNumber: state.turnNumber + 1,
      action: 'moveToken',
      payload: { tokenId, diceValue, newPosition: newPos, knockedOut: knockedOutTokenId },
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

  // Server-side dice roll (cryptographically secure)
  rollDice(): number {
    // In production, use crypto.randomInt(1, 7)
    return Math.floor(Math.random() * 6) + 1;
  },
};