'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { sound } from '@/lib/sound';
import { ChessPiece, INITIAL_CHESS_BOARD, CHESS_ICONS } from './types';

interface ChessGameViewProps {
  onGameOver: (winner: 'w' | 'b') => void;
  selectedMode: 'strangers' | 'friends' | 'bot';
  onClockTick?: (whiteTime: number, blackTime: number, turn: 'w' | 'b') => void;
}

export function ChessGameView({ onGameOver, selectedMode, onClockTick }: ChessGameViewProps) {
  const [chessBoard, setChessBoard] = useState<ChessPiece[][]>(() =>
    INITIAL_CHESS_BOARD.map((row) => [...row])
  );
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [chessTurn, setChessTurn] = useState<'w' | 'b'>('w');
  const [chessWinner, setChessWinner] = useState<'w' | 'b' | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [whiteTime, setWhiteTime] = useState(180);
  const [blackTime, setBlackTime] = useState(180);

  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent of clock tick
  useEffect(() => {
    onClockTick?.(whiteTime, blackTime, chessTurn);
  }, [whiteTime, blackTime, chessTurn, onClockTick]);

  // Blitz Clock interval with cleanup
  useEffect(() => {
    if (chessWinner) {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
      return;
    }

    clockTimerRef.current = setInterval(() => {
      if (chessTurn === 'w') {
        setWhiteTime((t) => {
          if (t <= 1) {
            handleTimeoutLoss('w');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            handleTimeoutLoss('b');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, [chessTurn, chessWinner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  function handleTimeoutLoss(timedOutPlayer: 'w' | 'b') {
    const winner = timedOutPlayer === 'w' ? 'b' : 'w';
    setChessWinner(winner);
    if (winner === 'w') {
      sound.playWinFanfare();
    } else {
      sound.playPop(300);
    }
    onGameOver(winner);
  }

  function resetChess() {
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    setChessBoard(INITIAL_CHESS_BOARD.map((row) => [...row]));
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setChessTurn('w');
    setChessWinner(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setWhiteTime(180);
    setBlackTime(180);
  }

  function getLegalMoves(r: number, c: number, board: ChessPiece[][]): [number, number][] {
    const piece = board[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];
    const color = piece.color;
    const oppColor = color === 'w' ? 'b' : 'w';

    const inBounds = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === startRow && !board[r + 2 * dir][c]) {
          moves.push([r + 2 * dir, c]);
        }
      }
      for (const dc of [-1, 1]) {
        if (inBounds(r + dir, c + dc) && board[r + dir][c + dc]?.color === oppColor) {
          moves.push([r + dir, c + dc]);
        }
      }
    } else if (piece.type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color !== color) {
          moves.push([nr, nc]);
        }
      }
    } else if (piece.type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc) && board[nr][nc]?.color !== color) {
            moves.push([nr, nc]);
          }
        }
      }
    } else {
      const dirs: [number, number][] = [];
      if (piece.type === 'b' || piece.type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (piece.type === 'r' || piece.type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          if (!board[nr][nc]) {
            moves.push([nr, nc]);
          } else {
            if (board[nr][nc]?.color === oppColor) moves.push([nr, nc]);
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    }
    return moves;
  }

  function handleChessSquareClick(r: number, c: number) {
    if (chessWinner || chessTurn !== 'w') return;

    const clickedPiece = chessBoard[r][c];

    if (clickedPiece && clickedPiece.color === 'w') {
      sound.playPop(480);
      setSelectedSquare([r, c]);
      setValidMoves(getLegalMoves(r, c, chessBoard));
      return;
    }

    if (selectedSquare) {
      const isDestinationValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
      if (isDestinationValid) {
        const [fromR, fromC] = selectedSquare;
        const movedPiece = chessBoard[fromR][fromC];
        const targetPiece = chessBoard[r][c];

        const nextBoard = chessBoard.map((row) => [...row]);
        nextBoard[r][c] = movedPiece;
        nextBoard[fromR][fromC] = null;

        setLastMove({ from: [fromR, fromC], to: [r, c] });

        if (targetPiece) {
          sound.playMatchChord();
          const symbolKey = `${targetPiece.color}-${targetPiece.type}`;
          setCapturedBlack((prev) => [...prev, CHESS_ICONS[symbolKey] || targetPiece.type]);
          if (targetPiece.type === 'k') {
            sound.playWinFanfare();
            setChessWinner('w');
            setChessBoard(nextBoard);
            onGameOver('w');
            return;
          }
        } else {
          sound.playChessMove();
        }

        setChessBoard(nextBoard);
        setSelectedSquare(null);
        setValidMoves([]);
        setChessTurn('b');

        if (selectedMode === 'bot') {
          botTimerRef.current = setTimeout(() => {
            makeChessBotMove(nextBoard);
          }, 600);
        }
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  }

  function makeChessBotMove(board: ChessPiece[][]) {
    const allBlackMoves: { from: [number, number]; to: [number, number]; targetPiece: ChessPiece }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.color === 'b') {
          const moves = getLegalMoves(r, c, board);
          for (const [tr, tc] of moves) {
            allBlackMoves.push({
              from: [r, c],
              to: [tr, tc],
              targetPiece: board[tr][tc],
            });
          }
        }
      }
    }

    if (allBlackMoves.length === 0) {
      sound.playWinFanfare();
      setChessWinner('w');
      onGameOver('w');
      return;
    }

    const kingCapture = allBlackMoves.find((m) => m.targetPiece?.type === 'k');
    const pieceCapture = allBlackMoves.find((m) => m.targetPiece !== null);
    const chosenMove = kingCapture || pieceCapture || allBlackMoves[Math.floor(Math.random() * allBlackMoves.length)];

    const [fr, fc] = chosenMove.from;
    const [tr, tc] = chosenMove.to;
    const movingPiece = board[fr][fc];
    const targetPiece = board[tr][tc];

    const nextBoard = board.map((row) => [...row]);
    nextBoard[tr][tc] = movingPiece;
    nextBoard[fr][fc] = null;

    setLastMove({ from: [fr, fc], to: [tr, tc] });

    if (targetPiece) {
      sound.playPop(300);
      const symbolKey = `${targetPiece.color}-${targetPiece.type}`;
      setCapturedWhite((prev) => [...prev, CHESS_ICONS[symbolKey] || targetPiece.type]);
      if (targetPiece.type === 'k') {
        setChessWinner('b');
        onGameOver('b');
      }
    } else {
      sound.playChessMove();
    }

    setChessBoard(nextBoard);
    setChessTurn('w');
  }

  return (
    <div className="flex flex-col items-center space-y-3 py-1">
      {/* Captured Pieces Bar */}
      <div className="w-full flex items-center justify-between text-xs px-3 py-2 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-semibold text-[11px]">Captured Black:</span>
          <span className="text-lg tracking-tight text-white">{capturedBlack.join(' ') || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-semibold text-[11px]">Captured White:</span>
          <span className="text-lg tracking-tight text-zinc-300">{capturedWhite.join(' ') || '—'}</span>
        </div>
      </div>

      {/* 8x8 Chess Grid */}
      <div
        role="grid"
        aria-label="Chess Board"
        className="grid grid-cols-8 grid-rows-8 w-72 h-72 sm:w-84 sm:h-84 border-4 border-amber-600/30 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(217,119,6,0.2)] bg-zinc-950"
      >
        {chessBoard.map((row, r) =>
          row.map((piece, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
            const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
            const isLastMove =
              lastMove &&
              ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                (lastMove.to[0] === r && lastMove.to[1] === c));

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleChessSquareClick(r, c)}
                aria-label={`Square ${String.fromCharCode(97 + c)}${8 - r}${
                  piece ? `, ${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}` : ''
                }`}
                className={`relative flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isSelected
                    ? 'bg-amber-500/50 ring-2 ring-amber-400 inset-0'
                    : isLastMove
                    ? 'bg-indigo-500/30'
                    : isDark
                    ? 'bg-zinc-900/90 hover:bg-zinc-800'
                    : 'bg-zinc-800/50 hover:bg-zinc-700/60'
                }`}
              >
                {isValidMove && (
                  <span className="absolute w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-300 animate-pulse z-10" />
                )}

                {piece && (
                  <span
                    className={`text-2xl sm:text-3xl select-none transition-transform hover:scale-110 ${
                      piece.color === 'w'
                        ? 'text-amber-100 drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]'
                        : 'text-zinc-950 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {CHESS_ICONS[`${piece.color}-${piece.type}`]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Status & Banner */}
      <div className="text-center space-y-1">
        {chessWinner ? (
          <div className="px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-extrabold text-xs inline-flex items-center gap-2 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{chessWinner === 'w' ? 'Checkmate! You Won! 🏆' : 'Checkmate! Rival Won! ♟️'}</span>
          </div>
        ) : (
          <p className="text-xs font-semibold text-zinc-400">
            {chessTurn === 'w' ? (
              <span className="text-amber-400 font-bold">Your turn (White) — Click piece to move</span>
            ) : (
              <span className="text-zinc-400">Opponent calculating move...</span>
            )}
          </p>
        )}
      </div>

      {chessWinner && (
        <button
          onClick={resetChess}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Rematch Blitz</span>
        </button>
      )}
    </div>
  );
}
