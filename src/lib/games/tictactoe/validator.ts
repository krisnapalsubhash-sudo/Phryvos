// Tic-Tac-Toe Game Validator - Server-side move validation

import { GameValidator, ValidationResult, TicTacToeGameState, TicTacToeMovePayload, GameRoom, GameResult, GameMove } from '../types';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

export const ticTacToeValidator: GameValidator = {
  getInitialState() {
    return {
      board: Array(9).fill(null),
      currentTurn: 'X',
      winner: null,
      winningLine: null,
      moveCount: 0,
    } as TicTacToeGameState;
  },

  serializeState(state: TicTacToeGameState): string {
    return JSON.stringify(state);
  },

  deserializeState(serialized: string): TicTacToeGameState {
    return JSON.parse(serialized);
  },

  checkGameOver(state: TicTacToeGameState) {
    if (state.winner) {
      return {
        gameOver: true,
        result: state.winner === 'draw' ? 'DRAW' : (state.winner === 'X' ? 'PLAYER1_WIN' : 'PLAYER2_WIN'),
        winnerId: state.winner === 'X' ? 'player1' : 'player2', // Will be mapped to actual userId
      };
    }
    return { gameOver: false };
  },

  validateMove(gameRoom: GameRoom, playerId: string, action: string, payload: any): ValidationResult {
    // Only allow 'move' action
    if (action !== 'move') {
      return { valid: false, error: 'Invalid action. Only "move" is allowed.' };
    }

    const movePayload = payload as TicTacToeMovePayload;
    const { cellIndex } = movePayload;

    // Validate cell index
    if (typeof cellIndex !== 'number' || cellIndex < 0 || cellIndex > 8) {
      return { valid: false, error: 'Invalid cell index. Must be 0-8.' };
    }

    // Deserialize current state
    const state = this.deserializeState(gameRoom.gameState) as TicTacToeGameState;

    // Check if game is already over
    if (state.winner) {
      return { valid: false, error: 'Game is already over.' };
    }

    // Check if it's player's turn
    const playerIndex = gameRoom.participants.findIndex(p => p.userId === playerId);
    if (playerIndex === -1) {
      return { valid: false, error: 'Player not in game.' };
    }

    const expectedPlayer = playerIndex === 0 ? 'X' : 'O';
    if (state.currentTurn !== expectedPlayer) {
      return { valid: false, error: 'Not your turn.' };
    }

    // Check if cell is empty
    if (state.board[cellIndex] !== null) {
      return { valid: false, error: 'Cell already occupied.' };
    }

    // Apply move
    const newBoard = [...state.board];
    newBoard[cellIndex] = expectedPlayer;
    const newMoveCount = state.moveCount + 1;

    // Check for winner
    let winner: 'X' | 'O' | 'draw' | null = null;
    let winningLine: number[] | null = null;

    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        winner = newBoard[a];
        winningLine = combo;
        break;
      }
    }

    // Check for draw
    if (!winner && newMoveCount === 9) {
      winner = 'draw';
    }

    const newState: TicTacToeGameState = {
      ...state,
      board: newBoard,
      currentTurn: expectedPlayer === 'X' ? 'O' : 'X',
      winner,
      winningLine,
      moveCount: newMoveCount,
    };

    const gameOver = !!winner;
    let result: GameResult | undefined;
    let winnerId: string | undefined;

    if (gameOver) {
      if (winner === 'draw') {
        result = 'DRAW';
      } else {
        result = winner === 'X' ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
        winnerId = gameRoom.participants.find(p =>
          (winner === 'X' && p.color === 'white') || (winner === 'O' && p.color === 'black')
        )?.userId;
      }
    }

    // Create move record
    const move: GameMove = {
      moveId: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      playerId,
      turnNumber: newMoveCount,
      action: 'move',
      payload: { cellIndex, player: expectedPlayer },
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
};