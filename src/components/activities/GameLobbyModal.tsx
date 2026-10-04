'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Bot,
  Globe,
  Sparkles,
  Play,
  Check,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { MOCK_USERS } from '@/lib/mock/users';
import { toast } from 'sonner';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { GameInfo, GameMode, GameScores } from './games/types';
import { TicTacToeGameView } from './games/TicTacToeGameView';
import { LudoGameView } from './games/LudoGameView';
import { ChessGameView } from './games/ChessGameView';
import { TriviaGameView } from './games/TriviaGameView';

export type { GameInfo, GameMode, GameScores };

export const ALL_GAMES: GameInfo[] = [
  {
    id: 'chess',
    title: 'Fast Chess Arena',
    emoji: '♟️',
    category: 'Strategy • 3-Min Blitz',
    players: '2 Players',
    description: 'Rapid blitz chess with interactive piece moves, countdown clocks, and AI bot.',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  },
  {
    id: 'ludo',
    title: 'Ludo Royal Stadium',
    emoji: '🎲',
    category: 'Race • 4-Bases & Knockouts',
    players: '2-4 Players',
    description: 'Roll animated 3D dice, knock rivals back to base, and sprint tokens home.',
    color: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
  },
  {
    id: 'tictactoe',
    title: 'Cyber Neon Tic-Tac-Toe',
    emoji: '⚔️',
    category: 'Instant • Laser Strike',
    players: '2 Players',
    description: 'Neon glowing 3x3 showdown with sound chord FX, score tracking, and bot AI.',
    color: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  },
  {
    id: 'trivia',
    title: 'Trivia Orbit',
    emoji: '🎯',
    category: 'Party • Speed Rounds',
    players: '2-8 Players',
    description: 'Rapid-fire culture, science, geography, and curiosity speed duels.',
    color: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  },
];

interface GameLobbyModalProps {
  game: GameInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GameLobbyModal({ game, isOpen, onClose }: GameLobbyModalProps) {
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(game);
  const [selectedMode, setSelectedMode] = useState<GameMode>('bot');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchedPlayer, setMatchedPlayer] = useState<(typeof MOCK_USERS)[0] | null>(null);
  const [scores, setScores] = useState<GameScores>({ me: 0, opponent: 0 });
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

  // Blitz chess clocks for header display
  const [chessClock, setChessClock] = useState<{ white: number; black: number; turn: 'w' | 'b' }>({
    white: 180,
    black: 180,
    turn: 'w',
  });

  // A11y Focus trap & Esc dismiss
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  // Sync game from prop
  useEffect(() => {
    if (isOpen) {
      setSelectedGame(game);
      setGameStarted(false);
      setIsMatchmaking(false);
      setMatchedPlayer(null);
      setScores({ me: 0, opponent: 0 });
      setFloatingReactions([]);
      setChessClock({ white: 180, black: 180, turn: 'w' });
    }
  }, [isOpen, game]);

  function triggerReaction(emoji: string) {
    sound.playPop(620);
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 70) + 15;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1500);
  }

  const handleLaunchGame = () => {
    sound.playPop(480);
    if (selectedMode === 'strangers') {
      setIsMatchmaking(true);
      setTimeout(() => {
        const randUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
        setMatchedPlayer(randUser);
        setIsMatchmaking(false);
        setGameStarted(true);
        sound.playMatchChord();
      }, 1500);
    } else if (selectedMode === 'friends') {
      if (!selectedFriend) {
        toast.error('Please choose a friend to send the game challenge to!');
        return;
      }
      sound.playMatchChord();
      toast.success('Game challenge dispatched!');
      setTimeout(() => {
        setGameStarted(true);
      }, 1000);
    } else {
      setGameStarted(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="arcade-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop(340);
            onClose();
          }}
          className="absolute inset-0 bg-black/85 backdrop-blur-lg"
        />

        {/* Floating In-Game Reactions */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: '80%', x: `${r.x}%`, scale: 0.6 }}
              animate={{ opacity: 0, y: '20%', scale: 1.8 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute text-4xl drop-shadow-lg"
            >
              {r.emoji}
            </motion.div>
          ))}
        </div>

        {/* Arcade Console Frame */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-zinc-950/95 border-2 border-primary/40 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col max-h-[94vh] z-10"
        >
          {/* Top Arcade Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {selectedGame && (
                <button
                  onClick={() => {
                    sound.playPop(340);
                    setSelectedGame(null);
                    setGameStarted(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Back to Game List"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Games</span>
                </button>
              )}

              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 ${
                  selectedGame ? selectedGame.color : 'bg-primary/20 text-primary border-primary/30'
                }`}
              >
                {selectedGame ? selectedGame.emoji : '🎮'}
              </div>
              <div>
                <h2 id="arcade-modal-title" className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>{selectedGame ? selectedGame.title : 'Arcade Games Arena'}</span>
                  {selectedGame && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {selectedGame.players}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {selectedGame ? selectedGame.description : 'Pick a game to play vs strangers, friends, or bot'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop(340);
                onClose();
              }}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* VIEW 0: GAME SELECTOR */}
            {!selectedGame && (
              <div className="space-y-3">
                <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider mb-2">
                  Select Game to Play:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_GAMES.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        sound.playPop(520);
                        setSelectedGame(g);
                        setGameStarted(false);
                      }}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-primary/50 hover:bg-zinc-900/90 transition-all cursor-pointer group flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl border shadow-inner group-hover:scale-110 transition-transform ${g.color}`}
                        >
                          {g.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-sm text-white group-hover:text-primary transition-colors">
                              {g.title}
                            </h3>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                              {g.players}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">{g.category}</p>
                        </div>
                      </div>

                      <span className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 1: LOBBY & MODE PICKER */}
            {selectedGame && !gameStarted && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Select Game Mode:</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'strangers',
                        label: 'With Strangers',
                        icon: Globe,
                        desc: 'Radar Matchmaking',
                        accent: 'from-indigo-500/20 to-purple-500/20',
                      },
                      {
                        id: 'friends',
                        label: 'With Friends',
                        icon: Users,
                        desc: 'Challenge Buddy',
                        accent: 'from-cyan-500/20 to-blue-500/20',
                      },
                      {
                        id: 'bot',
                        label: 'Play vs Bot',
                        icon: Bot,
                        desc: 'Instant AI Duel',
                        accent: 'from-amber-500/20 to-rose-500/20',
                      },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = selectedMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            sound.playPop(440);
                            setSelectedMode(mode.id as GameMode);
                          }}
                          className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? 'bg-gradient-to-b ' + mode.accent + ' border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] ring-2 ring-primary/40'
                              : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-zinc-400'}`} />
                          <span className="text-xs font-bold leading-tight">{mode.label}</span>
                          <span className="text-[10px] text-zinc-400 leading-none">
                            {mode.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-view: Friend Picker */}
                {selectedMode === 'friends' && (
                  <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <p className="text-xs font-bold text-zinc-200">Select Friend to Challenge:</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {MOCK_USERS.slice(0, 5).map((friend) => (
                        <div
                          key={friend.id}
                          onClick={() => {
                            sound.playPop(480);
                            setSelectedFriend(friend.id);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            selectedFriend === friend.id
                              ? 'bg-primary/25 border border-primary text-white'
                              : 'hover:bg-zinc-800/60 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{friend.avatar}</span>
                            <div>
                              <p className="text-xs font-bold text-zinc-200">{friend.displayName}</p>
                              <p className="text-[10px] text-zinc-500">@{friend.username}</p>
                            </div>
                          </div>
                          {selectedFriend === friend.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matchmaking radar simulation */}
                {isMatchmaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-2"
                  >
                    <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-indigo-200">
                      Searching global radar for challenger...
                    </p>
                    <p className="text-[10px] text-zinc-400">Locking 75° solar orbit match</p>
                  </motion.div>
                )}

                {/* Launch Button */}
                <button
                  type="button"
                  onClick={handleLaunchGame}
                  disabled={isMatchmaking}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-black text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {selectedMode === 'strangers'
                      ? 'Find Challenger & Enter Arena'
                      : selectedMode === 'friends'
                      ? 'Send Challenge & Launch'
                      : 'Start Game vs AI Bot'}
                  </span>
                </button>
              </div>
            )}

            {/* VIEW 2: ACTIVE PLAYABLE GAME ARENA */}
            {selectedGame && gameStarted && (
              <div className="space-y-4">
                {/* Battle Header */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <span className="text-2xl">😊</span>
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">You</p>
                      <p className="text-[10px] text-primary font-bold">Wins: {scores.me}</p>
                    </div>
                  </div>

                  {/* Center VS or Blitz Timer */}
                  <div className="text-center px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                    {selectedGame.id === 'chess' ? (
                      <div className="flex items-center gap-3 text-xs font-mono font-bold">
                        <span className={chessClock.turn === 'w' ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}>
                          {formatTime(chessClock.white)}
                        </span>
                        <span className="text-zinc-600">:</span>
                        <span className={chessClock.turn === 'b' ? 'text-rose-400 animate-pulse' : 'text-zinc-500'}>
                          {formatTime(chessClock.black)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-black tracking-widest text-zinc-400 uppercase">
                        VS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-right">
                    <div>
                      <p className="text-xs font-extrabold text-white">
                        {selectedMode === 'bot'
                          ? 'Grandmaster AI 🤖'
                          : matchedPlayer?.displayName || 'Friend'}
                      </p>
                      <p className="text-[10px] text-primary font-bold">Wins: {scores.opponent}</p>
                    </div>
                    <span className="text-2xl">
                      {selectedMode === 'bot' ? '🤖' : matchedPlayer?.avatar || '👤'}
                    </span>
                  </div>
                </div>

                {/* Quick Reaction Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs">
                  <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>Quick React:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {['🔥', '😱', '🎲', '👑', '👏', '🎯'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => triggerReaction(em)}
                        className="hover:scale-130 active:scale-95 transition-transform text-base focus:outline-none"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MODULAR GAME COMPONENT DISPATCH */}
                {selectedGame.id === 'tictactoe' && (
                  <TicTacToeGameView
                    selectedMode={selectedMode}
                    onGameOver={(winner) => {
                      if (winner === 'X') {
                        setScores((s) => ({ ...s, me: s.me + 1 }));
                      } else if (winner === 'O') {
                        setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
                      }
                    }}
                  />
                )}

                {selectedGame.id === 'ludo' && (
                  <LudoGameView
                    selectedMode={selectedMode}
                    onGameOver={(winner) => {
                      if (winner === 'me') {
                        setScores((s) => ({ ...s, me: s.me + 1 }));
                      } else {
                        setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
                      }
                    }}
                  />
                )}

                {selectedGame.id === 'chess' && (
                  <ChessGameView
                    selectedMode={selectedMode}
                    onClockTick={(white, black, turn) => {
                      setChessClock({ white, black, turn });
                    }}
                    onGameOver={(winner) => {
                      if (winner === 'w') {
                        setScores((s) => ({ ...s, me: s.me + 1 }));
                      } else {
                        setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
                      }
                    }}
                  />
                )}

                {selectedGame.id !== 'tictactoe' &&
                  selectedGame.id !== 'ludo' &&
                  selectedGame.id !== 'chess' && (
                    <TriviaGameView
                      selectedMode={selectedMode}
                      gameTitle={selectedGame.title}
                      gameEmoji={selectedGame.emoji}
                      onGameOver={(winner) => {
                        if (winner === 'me') {
                          setScores((s) => ({ ...s, me: s.me + 1 }));
                        } else if (winner === 'opponent') {
                          setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
                        }
                      }}
                    />
                  )}

                {/* Return to Lobby */}
                <button
                  type="button"
                  onClick={() => setGameStarted(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all border border-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Change Mode / Leave Arena Table
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
