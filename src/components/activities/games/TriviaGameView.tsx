'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { sound } from '@/lib/sound';
import { TRIVIA_QUESTIONS, TriviaQuestion } from './types';

interface TriviaGameViewProps {
  onGameOver: (winner: 'me' | 'opponent' | 'Tie') => void;
  selectedMode: 'strangers' | 'friends' | 'bot';
  gameTitle?: string;
  gameEmoji?: string;
}

const QUESTION_SECONDS = 15;

export function TriviaGameView({
  onGameOver,
  selectedMode,
  gameTitle = 'Trivia Orbit',
  gameEmoji = '🧠',
}: TriviaGameViewProps) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'me' | 'opponent' | 'Tie' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ: TriviaQuestion = TRIVIA_QUESTIONS[questionIdx] || TRIVIA_QUESTIONS[0];

  // Question countdown timer
  useEffect(() => {
    if (gameOver || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameOver, isAnswered, questionIdx]);

  // Bot response simulation
  useEffect(() => {
    if (gameOver || isAnswered || selectedMode !== 'bot') return;

    // Bot decides to answer between 3 and 10 seconds
    const botDelay = Math.floor(Math.random() * 5000) + 3000;
    botAnswerTimerRef.current = setTimeout(() => {
      // 70% chance bot gets it right
      const isBotCorrect = Math.random() < 0.7;
      if (isBotCorrect) {
        setOppScore((s) => s + 10);
      }
    }, botDelay);

    return () => {
      if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
    };
  }, [questionIdx, isAnswered, gameOver, selectedMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
    };
  }, []);

  function handleTimeExpire() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswered(true);
    sound.playPop(300);

    advanceTimerRef.current = setTimeout(() => {
      moveToNextQuestion(myScore, oppScore);
    }, 2000);
  }

  function handleSelectOption(optIdx: number) {
    if (isAnswered || gameOver) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.answer;
    let nextMyScore = myScore;

    if (isCorrect) {
      sound.playMatchChord();
      const points = 10 + Math.max(0, timeLeft);
      nextMyScore = myScore + points;
      setMyScore(nextMyScore);
    } else {
      sound.playPop(300);
    }

    advanceTimerRef.current = setTimeout(() => {
      moveToNextQuestion(nextMyScore, oppScore);
    }, 2000);
  }

  function moveToNextQuestion(currentMyScore: number, currentOppScore: number) {
    if (questionIdx + 1 < TRIVIA_QUESTIONS.length) {
      setQuestionIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(QUESTION_SECONDS);
    } else {
      // Final results
      setGameOver(true);
      let result: 'me' | 'opponent' | 'Tie' = 'Tie';
      if (currentMyScore > currentOppScore) {
        result = 'me';
        sound.playWinFanfare();
      } else if (currentOppScore > currentMyScore) {
        result = 'opponent';
        sound.playPop(300);
      } else {
        result = 'Tie';
        sound.playPop(440);
      }
      setGameResult(result);
      onGameOver(result);
    }
  }

  function resetTrivia() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);

    setQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(QUESTION_SECONDS);
    setMyScore(0);
    setOppScore(0);
    setGameOver(false);
    setGameResult(null);
  }

  return (
    <div className="space-y-4 py-2">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">{gameEmoji}</span>
          <span className="font-bold text-white">{currentQ.category}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">
            Q {questionIdx + 1} of {TRIVIA_QUESTIONS.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className={timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}>
              {timeLeft}s
            </span>
          </div>
          <div className="text-[11px] font-bold text-primary">
            Score: {myScore} pts
          </div>
        </div>
      </div>

      {!gameOver ? (
        <div className="space-y-3">
          {/* Question Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-primary/20 text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-2">
              Question {questionIdx + 1}
            </span>
            <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
              {currentQ.q}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Trivia answers">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = isAnswered && idx === currentQ.answer;
              const isWrong = isAnswered && isSelected && idx !== currentQ.answer;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isCorrect
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : isWrong
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 ring-2 ring-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : isSelected
                      ? 'bg-primary/25 border-primary text-white ring-2 ring-primary/40'
                      : isAnswered
                      ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-primary/50 hover:bg-zinc-800/80 text-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-zinc-800/80 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </span>

                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isWrong && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick status bar */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs font-bold text-zinc-400"
            >
              Next question loading in 2s...
            </motion.div>
          )}
        </div>
      ) : (
        /* Game Over Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-zinc-900/80 border border-primary/30 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 mx-auto flex items-center justify-center text-3xl shadow-lg">
            <Trophy className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              {gameResult === 'me'
                ? '🏆 You Won the Trivia Duel!'
                : gameResult === 'opponent'
                ? '👏 Opponent Won this Round!'
                : "🤝 It's a Dead Heat Tie!"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Final Score: You ({myScore} pts) vs Opponent ({oppScore} pts)
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetTrivia}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Another Round</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
