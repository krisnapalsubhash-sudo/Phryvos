'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { sound } from '@/lib/sound';

interface TicTacToeModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  onSendGameMove?: (board: Array<'X' | 'O' | null>) => void;
}

type Player = 'X' | 'O';
type BoardState = Array<Player | null>;

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: BoardState): { winner: Player | 'tie' | null; combo?: number[] } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'tie' };
  }
  return { winner: null };
}

export function TicTacToeModal({ isOpen, onClose, partnerName }: TicTacToeModalProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [scores, setScores] = useState({ me: 0, partner: 0 });

  if (!isOpen) return null;

  const { winner, combo } = checkWinner(board);

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    sound.playPop(520);
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const winCheck = checkWinner(newBoard);
    if (winCheck.winner === 'X') {
      sound.playWinFanfare();
      setScores((prev) => ({ ...prev, me: prev.me + 1 }));
      return;
    }
    if (winCheck.winner === 'tie') {
      sound.playPop(340);
      return;
    }

    // Stranger's turn (Turn 'O')
    setTurn('O');
    setTimeout(() => {
      // Find available empty cells
      const emptyIndices = newBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length > 0) {
        sound.playPop(420);
        const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const partnerBoard = [...newBoard];
        partnerBoard[randomIdx] = 'O';
        setBoard(partnerBoard);
        setTurn('X');

        const partnerWin = checkWinner(partnerBoard);
        if (partnerWin.winner === 'O') {
          sound.playPop(260);
          setScores((prev) => ({ ...prev, partner: prev.partner + 1 }));
        }
      }
    }, 600);
  };

  const handleReset = () => {
    sound.playPop(440);
    setBoard(Array(9).fill(null));
    setTurn('X');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="relative w-full max-w-xs sm:max-w-sm bg-card border border-border/80 rounded-3xl p-5 shadow-2xl z-10 overflow-hidden flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Zero-Kaata (Tic-Tac-Toe)</h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scores */}
          <div className="w-full flex items-center justify-around py-3 px-4 my-3 rounded-2xl bg-secondary/40 border border-border/40 text-xs">
            <div className="flex flex-col items-center">
              <span className="font-bold text-primary">You (X)</span>
              <span className="text-lg font-black">{scores.me}</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-muted-foreground">{partnerName} (O)</span>
              <span className="text-lg font-black">{scores.partner}</span>
            </div>
          </div>

          {/* Turn indicator / Winner banner */}
          <div className="h-6 mb-2 flex items-center justify-center text-xs font-semibold">
            {winner === 'X' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> You won this round! 🎉
              </span>
            )}
            {winner === 'O' && (
              <span className="text-rose-400">{partnerName} won this round!</span>
            )}
            {winner === 'tie' && <span className="text-amber-400">It's a draw! 🤝</span>}
            {!winner && turn === 'X' && <span className="text-primary">Your Turn (X)</span>}
            {!winner && turn === 'O' && (
              <span className="text-muted-foreground italic">{partnerName} is thinking...</span>
            )}
          </div>

          {/* Game Board 3x3 */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-background border border-border/80 shadow-inner">
            {board.map((cell, idx) => {
              const isCombo = combo?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={cell !== null || !!winner || turn === 'O'}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl text-3xl font-black flex items-center justify-center transition-all ${
                    cell === 'X'
                      ? 'text-primary bg-primary/10 border border-primary/40'
                      : cell === 'O'
                      ? 'text-rose-400 bg-rose-500/10 border border-rose-500/40'
                      : 'hover:bg-secondary/60 bg-secondary/20 border border-border/40 active:scale-95'
                  } ${isCombo ? 'ring-2 ring-emerald-400 animate-pulse' : ''}`}
                >
                  {cell}
                </button>
              );
            })}
          </div>

          {/* Footer Reset Button */}
          <div className="w-full flex items-center justify-between pt-4 mt-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Anti-Awkwardness Icebreaker
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rematch</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
