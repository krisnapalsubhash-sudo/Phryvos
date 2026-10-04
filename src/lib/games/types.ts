// Game Types & Interfaces for Multiplayer Games

export type GameType = 'chess' | 'ludo' | 'tictactoe' | 'trivia' | 'wordmystery';
export type GameRoomStatus = 'WAITING' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ABANDONED';
export type GameResult = 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | 'IN_PROGRESS';

export interface GameConfig {
  maxPlayers: number;
  turnTimeLimit?: number; // seconds per turn
  gameDurationLimit?: number; // total game time in seconds
  variant?: string; // e.g., 'blitz', 'rapid' for chess
}

export interface GameMove {
  moveId: string;
  playerId: string;
  turnNumber: number;
  action: string; // 'move', 'roll', 'guess', 'answer', etc.
  payload: Record<string, any>; // Game-specific data
  timestamp: string;
  validated: boolean;
}

export interface GameRoom {
  id: string;
  gameType: GameType;
  gameState: any; // Serialized game state
  status: GameRoomStatus;
  currentTurnPlayerId: string | null;
  moveHistory: GameMove[];
  config: GameConfig;
  participants: GameParticipant[];
  startedAt?: Date;
  finishedAt?: Date;
  winnerId?: string;
  result?: GameResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  color?: string; // 'white'/'black' for chess, 'red'/'blue' for ludo
  isReady: boolean;
  joinedAt: Date;
}

export interface CreateGameRequest {
  gameType: GameType;
  config?: Partial<GameConfig>;
  mode: 'bot' | 'friend' | 'stranger';
  friendId?: string; // for friend mode
}

export interface CreateGameResponse {
  success: boolean;
  gameId?: string;
  gameRoom?: GameRoom;
  error?: string;
}

export interface JoinGameRequest {
  gameId: string;
}

export interface JoinGameResponse {
  success: boolean;
  gameRoom?: GameRoom;
  error?: string;
}

export interface MoveRequest {
  gameId: string;
  action: string;
  payload: Record<string, any>;
}

export interface MoveResponse {
  success: boolean;
  gameRoom?: GameRoom;
  move?: GameMove;
  error?: string;
  retryAfterMs?: number;
}

export interface GameStateResponse {
  success: boolean;
  gameRoom?: GameRoom;
  error?: string;
}

export interface GameHistoryResponse {
  success: boolean;
  moves?: GameMove[];
  error?: string;
}

// Chess-specific types
export interface ChessGameState {
  fen: string; // Forsyth-Edwards Notation
  turn: 'w' | 'b';
  castlingRights: string; // 'KQkq' etc.
  enPassantTarget: string | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  whiteTime: number; // seconds
  blackTime: number; // seconds
  capturedWhite: string[]; // piece symbols
  capturedBlack: string[]; // piece symbols
  lastMove?: { from: string; to: string; piece: string };
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
}

export interface ChessMovePayload {
  from: string; // e.g., 'e2'
  to: string;   // e.g., 'e4'
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string; // Standard Algebraic Notation
}

// Ludo-specific types
export interface LudoGameState {
  board: LudoBoardPosition[];
  redTokens: LudoToken[];
  blueTokens: LudoToken[];
  currentPlayer: 'red' | 'blue';
  diceValue: number;
  rollsRemaining: number; // extra roll on 6
  winner?: 'red' | 'blue' | null;
  turnNumber: number;
}

export interface LudoBoardPosition {
  index: number; // 0-51 (main track) + home stretches
  type: 'main' | 'safe' | 'home' | 'start' | 'finish';
  color?: 'red' | 'blue' | 'yellow' | 'green';
}

export interface LudoToken {
  id: string;
  color: 'red' | 'blue';
  position: number; // -1 = in base, 0-51 = main track, 52-57 = home stretch, 58 = finished
}

export interface LudoMovePayload {
  tokenId: string;
  diceValue: number;
}

// Tic-Tac-Toe specific types
export interface TicTacToeGameState {
  board: Array<'X' | 'O' | null>;
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
  moveCount: number;
}

export interface TicTacToeMovePayload {
  cellIndex: number; // 0-8
}

// Trivia-specific types
export interface TriviaGameState {
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  scores: Record<string, number>; // userId -> score
  currentAnswers: Record<string, string | number>; // userId -> answer
  timeRemaining: number;
  phase: 'question' | 'answer' | 'results' | 'finished';
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // seconds
}

export interface TriviaMovePayload {
  answerIndex: number;
}

// Word Mystery specific types
export interface WordMysteryGameState {
  secretWord: string;
  category: string;
  hint: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrongGuesses: number;
  status: 'playing' | 'won' | 'lost';
  currentPlayer: 'guesser' | 'host'; // for 2-player variant
}

export interface WordMysteryMovePayload {
  guess: string; // single letter or full word
  type: 'letter' | 'word';
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  newState?: any;
  move?: GameMove;
  gameOver?: boolean;
  result?: GameResult;
  winnerId?: string;
}

// Game validator interface
export interface GameValidator {
  validateMove(gameRoom: GameRoom, playerId: string, action: string, payload: any): ValidationResult;
  getInitialState(config?: GameConfig): any;
  serializeState(state: any): string;
  deserializeState(serialized: string): any;
  checkGameOver(state: any): { gameOver: boolean; result?: GameResult; winnerId?: string };
  [key: string]: any;
}