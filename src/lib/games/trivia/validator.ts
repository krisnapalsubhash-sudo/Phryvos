// Trivia Game Validator - Server-side answer validation

import { GameValidator, ValidationResult, TriviaGameState, TriviaMovePayload, GameRoom, GameResult, GameMove } from '../types';

const TRIVIA_QUESTIONS = [
  // Science
  { id: 'sci1', question: 'What is the chemical symbol for gold?', options: ['Au', 'Ag', 'Fe', 'Cu'], correctAnswer: 0, category: 'Science', difficulty: 'easy', timeLimit: 15 },
  { id: 'sci2', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 1, category: 'Science', difficulty: 'easy', timeLimit: 15 },
  { id: 'sci3', question: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctAnswer: 2, category: 'Science', difficulty: 'easy', timeLimit: 15 },
  { id: 'sci4', question: 'How many bones are in an adult human body?', options: ['206', '208', '210', '212'], correctAnswer: 0, category: 'Science', difficulty: 'medium', timeLimit: 20 },
  { id: 'sci5', question: 'What is the speed of light in vacuum?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctAnswer: 0, category: 'Science', difficulty: 'medium', timeLimit: 20 },

  // Geography
  { id: 'geo1', question: 'What is the capital of Japan?', options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'], correctAnswer: 2, category: 'Geography', difficulty: 'easy', timeLimit: 15 },
  { id: 'geo2', question: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3, category: 'Geography', difficulty: 'easy', timeLimit: 15 },
  { id: 'geo3', question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswer: 1, category: 'Geography', difficulty: 'medium', timeLimit: 20 },
  { id: 'geo4', question: 'Which country has the most islands?', options: ['Philippines', 'Indonesia', 'Sweden', 'Canada'], correctAnswer: 3, category: 'Geography', difficulty: 'hard', timeLimit: 25 },
  { id: 'geo5', question: 'Mount Everest is located in which mountain range?', options: ['Andes', 'Rockies', 'Himalayas', 'Alps'], correctAnswer: 2, category: 'Geography', difficulty: 'easy', timeLimit: 15 },

  // History
  { id: 'hist1', question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: 2, category: 'History', difficulty: 'easy', timeLimit: 15 },
  { id: 'hist2', question: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'Michael Collins'], correctAnswer: 1, category: 'History', difficulty: 'easy', timeLimit: 15 },
  { id: 'hist3', question: 'The Titanic sank in which year?', options: ['1910', '1912', '1914', '1916'], correctAnswer: 1, category: 'History', difficulty: 'easy', timeLimit: 15 },
  { id: 'hist4', question: 'Which ancient wonder is still standing?', options: ['Hanging Gardens', 'Colossus of Rhodes', 'Great Pyramid of Giza', 'Lighthouse of Alexandria'], correctAnswer: 2, category: 'History', difficulty: 'medium', timeLimit: 20 },
  { id: 'hist5', question: 'Who painted the Mona Lisa?', options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'], correctAnswer: 2, category: 'History', difficulty: 'easy', timeLimit: 15 },

  // Pop Culture
  { id: 'pop1', question: 'Which movie won the first Academy Award for Best Picture?', options: ['Wings', 'The Jazz Singer', 'Sunrise', 'All Quiet on the Western Front'], correctAnswer: 0, category: 'Pop Culture', difficulty: 'hard', timeLimit: 25 },
  { id: 'pop2', question: 'What is the name of Harry Potter\'s owl?', options: ['Hedwig', 'Errol', 'Pigwidgeon', 'Hermes'], correctAnswer: 0, category: 'Pop Culture', difficulty: 'easy', timeLimit: 15 },
  { id: 'pop3', question: 'Which band performed "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correctAnswer: 2, category: 'Pop Culture', difficulty: 'easy', timeLimit: 15 },
  { id: 'pop4', question: 'In "Friends", what is the name of Ross\'s monkey?', options: ['Marcel', 'Bubbles', 'Jack', 'Bananas'], correctAnswer: 0, category: 'Pop Culture', difficulty: 'medium', timeLimit: 20 },
  { id: 'pop5', question: 'Who is the "King of Pop"?', options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury'], correctAnswer: 1, category: 'Pop Culture', difficulty: 'easy', timeLimit: 15 },

  // Technology
  { id: 'tech1', question: 'What does "CPU" stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Core Processing Unit'], correctAnswer: 0, category: 'Technology', difficulty: 'easy', timeLimit: 15 },
  { id: 'tech2', question: 'Who founded Microsoft?', options: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Larry Page'], correctAnswer: 1, category: 'Technology', difficulty: 'easy', timeLimit: 15 },
  { id: 'tech3', question: 'What year was the first iPhone released?', options: ['2005', '2007', '2009', '2011'], correctAnswer: 1, category: 'Technology', difficulty: 'medium', timeLimit: 20 },
  { id: 'tech4', question: 'What does "HTTP" stand for?', options: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol', 'Hyperlink Text Transfer Protocol', 'Home Tool Transfer Protocol'], correctAnswer: 0, category: 'Technology', difficulty: 'medium', timeLimit: 20 },
  { id: 'tech5', question: 'Which programming language is known as the "language of the web"?', options: ['Python', 'Java', 'JavaScript', 'C++'], correctAnswer: 2, category: 'Technology', difficulty: 'easy', timeLimit: 15 },
];

export const triviaValidator: GameValidator = {
  getInitialState(config?: any) {
    // Select 5 random questions for a game
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 5);

    return {
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      scores: {}, // userId -> score
      currentAnswers: {},
      timeRemaining: selectedQuestions[0]?.timeLimit || 15,
      phase: 'question',
    } as TriviaGameState;
  },

  serializeState(state: TriviaGameState): string {
    return JSON.stringify(state);
  },

  deserializeState(serialized: string): TriviaGameState {
    return JSON.parse(serialized);
  },

  checkGameOver(state: TriviaGameState) {
    if (state.phase === 'finished' || state.currentQuestionIndex >= state.questions.length) {
      // Determine winner based on scores
      const participants = Object.entries(state.scores);
      if (participants.length < 2) return { gameOver: true, result: 'DRAW' };

      const [p1, p2] = participants;
      if (p1[1] === p2[1]) return { gameOver: true, result: 'DRAW' };
      return {
        gameOver: true,
        result: p1[1] > p2[1] ? 'PLAYER1_WIN' : 'PLAYER2_WIN',
        winnerId: p1[1] > p2[1] ? 'player1' : 'player2',
      };
    }
    return { gameOver: false };
  },

  validateMove(gameRoom: GameRoom, playerId: string, action: string, payload: any): ValidationResult {
    if (action !== 'answer') {
      return { valid: false, error: 'Invalid action. Only "answer" is allowed.' };
    }

    const movePayload = payload as TriviaMovePayload;
    const { answerIndex } = movePayload;

    if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex > 3) {
      return { valid: false, error: 'Invalid answer index. Must be 0-3.' };
    }

    const state = this.deserializeState(gameRoom.gameState) as TriviaGameState;

    if (state.phase !== 'question') {
      return { valid: false, error: 'Not currently accepting answers.' };
    }

    if (state.currentQuestionIndex >= state.questions.length) {
      return { valid: false, error: 'Game already finished.' };
    }

    // Check if player already answered
    if (state.currentAnswers[playerId] !== undefined) {
      return { valid: false, error: 'Already answered this question.' };
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? 100 : 0; // Could add time bonus

    // Update scores
    const newScores = {
      ...state.scores,
      [playerId]: (state.scores[playerId] || 0) + pointsEarned,
    };

    const newAnswers = {
      ...state.currentAnswers,
      [playerId]: answerIndex,
    };

    // Check if all players have answered
    const allAnswered = gameRoom.participants.every(p => newAnswers[p.userId] !== undefined);

    let newPhase: TriviaGameState['phase'] = state.phase;
    let newQuestionIndex = state.currentQuestionIndex;
    let newTimeRemaining = state.timeRemaining;

    if (allAnswered) {
      newPhase = 'results';
      // Move to next question after results phase (handled by client timer)
    }

    const newState: TriviaGameState = {
      ...state,
      scores: newScores,
      currentAnswers: newAnswers,
      phase: newPhase,
      currentQuestionIndex: newQuestionIndex,
      timeRemaining: newTimeRemaining,
    };

    const move: GameMove = {
      moveId: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      playerId,
      turnNumber: state.currentQuestionIndex + 1,
      action: 'answer',
      payload: { answerIndex, isCorrect, pointsEarned, questionId: currentQuestion.id },
      timestamp: new Date().toISOString(),
      validated: true,
    };

    // Check if game is over (all questions answered)
    const gameOver = newPhase === 'results' && state.currentQuestionIndex >= state.questions.length - 1;
    let result: GameResult | undefined;
    let winnerId: string | undefined;

    if (gameOver) {
      const participants = Object.entries(newScores);
      if (participants.length === 2) {
        const [p1, p2] = participants;
        if (p1[1] === p2[1]) {
          result = 'DRAW';
        } else {
          result = p1[1] > p2[1] ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
          winnerId = p1[1] > p2[1] ? gameRoom.participants[0]?.userId : gameRoom.participants[1]?.userId;
        }
      }
    }

    return {
      valid: true,
      newState,
      move,
      gameOver,
      result,
      winnerId,
    };
  },

  getQuestionBank() {
    return TRIVIA_QUESTIONS;
  },

  getQuestionsByCategory(category: string) {
    return TRIVIA_QUESTIONS.filter(q => q.category === category);
  },

  getQuestionsByDifficulty(difficulty: string) {
    return TRIVIA_QUESTIONS.filter(q => q.difficulty === difficulty);
  },
};