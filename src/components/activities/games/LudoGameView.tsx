'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Dices } from 'lucide-react';
import { sound } from '@/lib/sound';

interface LudoGameViewProps {
  onGameOver: (winner: 'me' | 'opponent') => void;
  selectedMode: 'strangers' | 'friends' | 'bot';
}

export function LudoGameView({ onGameOver, selectedMode }: LudoGameViewProps) {
  const [redPos, setRedPos] = useState<number>(0);
  const [bluePos, setBluePos] = useState<number>(0);
  const [dice, setDice] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [turn, setTurn] = useState<'me' | 'opponent'>('me');
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(null);
  const [banner, setBanner] = useState('Roll 1 or 6 to deploy token to track!');

  const diceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (diceTimerRef.current) clearInterval(diceTimerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  function resetLudo() {
    if (diceTimerRef.current) clearInterval(diceTimerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setRedPos(0);
    setBluePos(0);
    setDice(1);
    setIsRolling(false);
    setTurn('me');
    setWinner(null);
    setBanner('Roll 1 or 6 to deploy token to track!');
  }

  function rollDice() {
    if (isRolling || winner || turn !== 'me') return;

    setIsRolling(true);
    sound.playDiceRoll();

    let count = 0;
    diceTimerRef.current = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        if (diceTimerRef.current) clearInterval(diceTimerRef.current);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDice(finalRoll);
        setIsRolling(false);
        processMove('me', finalRoll);
      }
    }, 55);
  }

  function processMove(player: 'me' | 'opponent', roll: number) {
    if (player === 'me') {
      let nextPos = redPos;
      if (nextPos === 0) {
        if (roll === 6 || roll === 1) {
          nextPos = 1;
          sound.playMatchChord();
          setBanner('🎉 Token deployed! Moving on the battlefield.');
        } else {
          setBanner(`Rolled ${roll}! Need 1 or 6 to deploy.`);
        }
      } else {
        nextPos = Math.min(16, nextPos + roll);
        sound.playPop(520);
        setBanner(`Advanced ${roll} steps! (Position ${nextPos}/16)`);
      }

      if (nextPos > 0 && nextPos < 16 && nextPos === bluePos && nextPos !== 8) {
        sound.playWinFanfare();
        setBluePos(0);
        setBanner('⚔️ KNOCKOUT! Opponent sent back to Base!');
      }

      setRedPos(nextPos);

      if (nextPos >= 16) {
        sound.playWinFanfare();
        setWinner('me');
        onGameOver('me');
        setBanner('🏆 VICTORY! You conquered the Ludo Stadium!');
        return;
      }

      setTurn('opponent');
      if (selectedMode === 'bot') {
        botTimerRef.current = setTimeout(() => {
          botMove();
        }, 900);
      }
    } else {
      let nextPos = bluePos;
      if (nextPos === 0) {
        if (roll === 6 || roll === 1) {
          nextPos = 1;
          sound.playPop(420);
          setBanner('Opponent deployed their token!');
        } else {
          setBanner(`Opponent rolled ${roll}, cannot deploy yet.`);
        }
      } else {
        nextPos = Math.min(16, nextPos + roll);
        sound.playPop(380);
        setBanner(`Opponent moved ${roll} steps to ${nextPos}/16.`);
      }

      if (nextPos > 0 && nextPos < 16 && nextPos === redPos && nextPos !== 8) {
        sound.playPop(300);
        setRedPos(0);
        setBanner('💥 Opponent knocked your token back to Base!');
      }

      setBluePos(nextPos);

      if (nextPos >= 16) {
        sound.playPop(300);
        setWinner('opponent');
        onGameOver('opponent');
        setBanner('Opponent reached Home first. Rematch?');
        return;
      }

      setTurn('me');
    }
  }

  function botMove() {
    setIsRolling(true);
    sound.playDiceRoll();
    let count = 0;
    diceTimerRef.current = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 7) {
        if (diceTimerRef.current) clearInterval(diceTimerRef.current);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDice(finalRoll);
        setIsRolling(false);
        processMove('opponent', finalRoll);
      }
    }, 55);
  }

  return (
    <div className="space-y-4 py-1">
      <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-zinc-900 to-indigo-500/10 border border-zinc-800 text-center text-xs font-bold text-zinc-200">
        {banner}
      </div>

      <div className="relative p-4 rounded-3xl bg-zinc-950 border-2 border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.15)] space-y-3">
        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-zinc-800">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">
                Red Base (You)
              </span>
              <p className="text-xs font-extrabold text-white">
                {redPos === 0 ? 'In Base (Need 1 or 6)' : `Step ${redPos}/16`}
              </p>
            </div>
            <span className="text-2xl">🔴</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                Blue Base (Rival)
              </span>
              <p className="text-xs font-extrabold text-white">
                {bluePos === 0 ? 'In Base' : `Step ${bluePos}/16`}
              </p>
            </div>
            <span className="text-2xl">🔵</span>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1.5 p-2 bg-zinc-900/60 rounded-2xl border border-zinc-800/80">
          {Array.from({ length: 16 }).map((_, stepIdx) => {
            const step = stepIdx + 1;
            const hasRed = redPos === step;
            const hasBlue = bluePos === step;
            const isSafe = step === 8;
            const isHome = step === 16;

            return (
              <div
                key={step}
                className={`h-11 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold relative transition-all ${
                  isHome
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                    : isSafe
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800/90 text-zinc-500'
                }`}
              >
                <span className="text-[9px] opacity-40">{step}</span>
                <div className="flex items-center gap-0.5">
                  {hasRed && <span className="text-xs animate-bounce">🔴</span>}
                  {hasBlue && <span className="text-xs animate-bounce">🔵</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Current Turn:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                turn === 'me'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              {turn === 'me' ? 'Your Roll 🔴' : 'Opponent 🔵'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-black text-white shadow-inner">
              {dice}
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || !!winner || turn !== 'me'}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Dices className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
            </button>
          </div>
        </div>
      </div>

      {winner && (
        <div className="text-center pt-2">
          <button
            onClick={resetLudo}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
