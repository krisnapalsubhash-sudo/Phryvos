'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import { sound } from '@/lib/sound';

interface TicTacToeGameViewProps {
  onGameOver: (winner: 'X' | 'O' | 'Tie') => void;
  selectedMode: 'strangers' | 'friends' | 'bot';
}

export function TicTacToeGameView({ onGameOver, selectedMode }: TicTacToeGameViewProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  function checkWinner(squares: (string | null)[]) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6],           // diags
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every((sq) => sq !== null)) {
      return { winner: 'Tie', line: null };
    }
    return null;
  }

  function handleClick(idx: number) {
    if (board[idx] || winner || turn !== 'X') return;

    sound.playPop(520);
    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      handleGameOver(winResult.winner, winResult.line);
      return;
    }

    setTurn('O');

    if (selectedMode === 'bot') {
      setTimeout(() => {
        makeBotMove(newBoard);
      }, 450);
    }
  }

  function makeBotMove(currentBoard: (string | null)[]) {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null) as number[];

    if (emptyIndices.length === 0) return;

    sound.playPop(440);
    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[randomIdx] = 'O';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      handleGameOver(result.winner, result.line);
    } else {
      setTurn('X');
    }
  }

  function handleGameOver(win: string, line: number[] | null) {
    setWinner(win);
    setWinningLine(line);
    if (win === 'X') {
      sound.playWinFanfare();
      onGameOver('X');
    } else if (win === 'O') {
      sound.playPop(300);
      onGameOver('O');
    } else {
      sound.playPop(400);
      onGameOver('Tie');
    }
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-2">
      <div className="relative grid grid-cols-3 gap-2.5 w-64 h-64 bg-zinc-950 p-3 rounded-3xl border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              aria-label={`Cell ${idx + 1}, ${cell ? `filled with ${cell}` : 'empty'}`}
              className={`rounded-2xl border text-3xl font-black flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                isWinningCell
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                  : cell === 'X'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : cell === 'O'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.4)]'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-primary/50'
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        {winner ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>
              {winner === 'Tie'
                ? "It's a Tie! 🤝"
                : winner === 'X'
                ? 'You Won! 🎉'
                : 'Opponent Won! 👏'}
            </span>
          </motion.div>
        ) : (
          <p className="text-xs font-semibold text-zinc-400">
            Current Turn:{' '}
            <strong className="text-white">
              {turn === 'X' ? 'Your Turn (X)' : "Opponent's Turn (O)"}
            </strong>
          </p>
        )}
      </div>

      {winner && (
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Play Again</span>
        </button>
      )}
    </div>
  );
}
