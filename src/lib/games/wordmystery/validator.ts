// Word Mystery Game Validator - Server-side guess validation

import { GameValidator, ValidationResult, WordMysteryGameState, WordMysteryMovePayload, GameRoom, GameResult, GameMove } from '../types';

const WORD_LIST = [
  { word: 'COFFEE', category: 'Drink / Daily Habit', hint: 'Keeps people awake, smells heavenly.' },
  { word: 'GUITAR', category: 'Music Instrument', hint: 'Has 6 strings and tells acoustic stories.' },
  { word: 'AURORA', category: 'Natural Wonder', hint: 'Dancing emerald lights in the polar sky.' },
  { word: 'PIZZA', category: 'Universal Food', hint: 'Round, warm, cheesy, and universally loved.' },
  { word: 'SUNSET', category: 'Everyday Magic', hint: 'Golden hour when day kisses the night.' },
  { word: 'HEADPHONES', category: 'Tech Gadget', hint: 'Worn over ears to tune out the world.' },
  { word: 'PASSPORT', category: 'Travel Essential', hint: 'Small booklet that opens global borders.' },
  { word: 'MOONLIGHT', category: 'Night Sky', hint: 'Gentle silver glow on a quiet midnight walk.' },
  { word: 'JOURNEY', category: 'Life Metaphor', hint: 'Not the destination, but the path itself.' },
  { word: 'MYSTERY', category: 'Game Meta', hint: 'What you are solving right now.' },
];

export const wordMysteryValidator: GameValidator = {
  getInitialState(config?: any) {
    const wordData = config?.secretWord
      ? WORD_LIST.find(w => w.word === config.secretWord.toUpperCase()) || WORD_LIST[0]
      : WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

    return {
      secretWord: wordData.word,
      category: wordData.category,
      hint: wordData.hint,
      guessedLetters: [],
      wrongGuesses: 0,
      maxWrongGuesses: 6,
      status: 'playing',
      currentPlayer: 'guesser',
    } as WordMysteryGameState;
  },

  serializeState(state: WordMysteryGameState): string {
    return JSON.stringify(state);
  },

  deserializeState(serialized: string): WordMysteryGameState {
    return JSON.parse(serialized);
  },

  checkGameOver(state: WordMysteryGameState) {
    if (state.status === 'won') {
      return { gameOver: true, result: 'PLAYER1_WIN', winnerId: 'player1' };
    }
    if (state.status === 'lost') {
      return { gameOver: true, result: 'PLAYER2_WIN', winnerId: 'player2' };
    }
    return { gameOver: false };
  },

  validateMove(gameRoom: GameRoom, playerId: string, action: string, payload: any): ValidationResult {
    if (action !== 'guess') {
      return { valid: false, error: 'Invalid action. Only "guess" is allowed.' };
    }

    const movePayload = payload as WordMysteryMovePayload;
    const { guess, type } = movePayload;

    if (!guess || typeof guess !== 'string') {
      return { valid: false, error: 'Guess is required.' };
    }

    const state = this.deserializeState(gameRoom.gameState) as WordMysteryGameState;

    if (state.status !== 'playing') {
      return { valid: false, error: 'Game is already over.' };
    }

    // In 2-player mode, check turn
    if (gameRoom.participants.length === 2) {
      const playerIndex = gameRoom.participants.findIndex(p => p.userId === playerId);
      if (playerIndex === -1) {
        return { valid: false, error: 'Player not in game.' };
      }

      const isGuesser = playerIndex === 0; // First player is guesser
      if ((isGuesser && state.currentPlayer !== 'guesser') || (!isGuesser && state.currentPlayer !== 'host')) {
        return { valid: false, error: 'Not your turn.' };
      }
    }

    const upperGuess = guess.toUpperCase().trim();

    if (type === 'letter') {
      // Single letter guess
      if (upperGuess.length !== 1 || !/^[A-Z]$/.test(upperGuess)) {
        return { valid: false, error: 'Letter guess must be a single letter A-Z.' };
      }

      if (state.guessedLetters.includes(upperGuess)) {
        return { valid: false, error: 'Letter already guessed.' };
      }

      const newGuessedLetters = [...state.guessedLetters, upperGuess];
      const isCorrect = state.secretWord.includes(upperGuess);
      const newWrongGuesses = isCorrect ? state.wrongGuesses : state.wrongGuesses + 1;

      // Check win: all letters revealed
      const allRevealed = state.secretWord.split('').every(l => newGuessedLetters.includes(l));

      // Check loss: max wrong guesses reached
      const isLost = newWrongGuesses >= state.maxWrongGuesses;

      let newStatus: WordMysteryGameState['status'] = 'playing';
      if (allRevealed) newStatus = 'won';
      else if (isLost) newStatus = 'lost';

      // Switch turn in 2-player mode
      let nextPlayer = state.currentPlayer;
      if (gameRoom.participants.length === 2) {
        nextPlayer = state.currentPlayer === 'guesser' ? 'host' : 'guesser';
      }

      const newState: WordMysteryGameState = {
        ...state,
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        status: newStatus,
        currentPlayer: nextPlayer,
      };

      const gameOver = newStatus !== 'playing';
      let result: GameResult | undefined;
      let winnerId: string | undefined;

      if (gameOver) {
        if (newStatus === 'won') {
          result = 'PLAYER1_WIN';
          winnerId = gameRoom.participants[0]?.userId;
        } else {
          result = 'PLAYER2_WIN';
          winnerId = gameRoom.participants[1]?.userId;
        }
      }

      const move: GameMove = {
        moveId: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        playerId,
        turnNumber: state.guessedLetters.length + 1,
        action: 'guess',
        payload: { guess: upperGuess, type: 'letter', correct: isCorrect },
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
    } else if (type === 'word') {
      // Full word guess
      const isCorrect = upperGuess === state.secretWord;

      const newState: WordMysteryGameState = {
        ...state,
        status: isCorrect ? 'won' : 'lost',
        guessedLetters: isCorrect ? [...new Set([...state.guessedLetters, ...state.secretWord.split('')])] : state.guessedLetters,
      };

      const gameOver = true;
      let result: GameResult | undefined;
      let winnerId: string | undefined;

      if (isCorrect) {
        result = 'PLAYER1_WIN';
        winnerId = gameRoom.participants[0]?.userId;
      } else {
        result = 'PLAYER2_WIN';
        winnerId = gameRoom.participants[1]?.userId;
      }

      const move: GameMove = {
        moveId: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        playerId,
        turnNumber: state.guessedLetters.length + 1,
        action: 'guess',
        payload: { guess: upperGuess, type: 'word', correct: isCorrect },
        timestamp: new Date().toISOString(),
        validated: true,
      };

      return {
        valid: true,
        newState,
        move,
        gameOver: true,
        result,
        winnerId,
      };
    }

    return { valid: false, error: 'Invalid guess type. Must be "letter" or "word".' };
  },

  // Get a random word for new game
  getRandomWord() {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  },

  // Get word list for admin
  getWordList() {
    return WORD_LIST;
  },
};