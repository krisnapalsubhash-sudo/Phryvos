import { LucideIcon } from 'lucide-react';

export interface GameInfo {
  id: string;
  title: string;
  emoji: string;
  category: string;
  players: string;
  description: string;
  color: string;
}

export type GameMode = 'strangers' | 'friends' | 'bot';

export interface GameScores {
  me: number;
  opponent: number;
}

// --- CHESS TYPES ---
export type ChessPiece = {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
} | null;

export const INITIAL_CHESS_BOARD: ChessPiece[][] = [
  [
    { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' },
    { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' },
    { type: 'n', color: 'b' }, { type: 'r', color: 'b' }
  ],
  [
    { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' },
    { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' },
    { type: 'p', color: 'b' }, { type: 'p', color: 'b' }
  ],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [
    { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' },
    { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' },
    { type: 'p', color: 'w' }, { type: 'p', color: 'w' }
  ],
  [
    { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' },
    { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' },
    { type: 'n', color: 'w' }, { type: 'r', color: 'w' }
  ]
];

export const CHESS_ICONS: Record<string, string> = {
  'w-k': '♔', 'w-q': '♕', 'w-r': '♖', 'w-b': '♗', 'w-n': '♘', 'w-p': '♙',
  'b-k': '♚', 'b-q': '♛', 'b-r': '♜', 'b-b': '♝', 'b-n': '♞', 'b-p': '♟',
};

// --- TRIVIA TYPES ---
export interface TriviaQuestion {
  q: string;
  options: string[];
  answer: number;
  category: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    q: 'Which space telescope observed the deepest infrared image of the universe in 2022?',
    options: ['Hubble', 'James Webb', 'Spitzer', 'Kepler'],
    answer: 1,
    category: 'Astronomy',
  },
  {
    q: 'In Indian classical music, what is the evening sunset raga often associated with calmness?',
    options: ['Bhairav', 'Yaman', 'Darbari', 'Todi'],
    answer: 1,
    category: 'Culture',
  },
  {
    q: 'What is the speed of light in vacuum rounded to thousands of km/s?',
    options: ['150,000', '300,000', '450,000', '600,000'],
    answer: 1,
    category: 'Physics',
  },
  {
    q: 'Which ancient wonder was located in Alexandria, Egypt?',
    options: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Mausoleum'],
    answer: 1,
    category: 'History',
  },
  {
    q: 'Which programming paradigm treats computation as evaluation of mathematical functions?',
    options: ['Object-Oriented', 'Procedural', 'Functional', 'Event-Driven'],
    answer: 2,
    category: 'Computer Science',
  },
];
