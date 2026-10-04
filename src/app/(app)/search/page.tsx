'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  UserPlus,
  MapPin,
  X,
  Sparkles,
  Gamepad2,
  HelpCircle,
  Quote,
  Users,
  Flame,
  Zap,
  ArrowRight,
  CheckCircle2,
  Radio,
  Compass
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_USERS } from '@/lib/mock/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { sound } from '@/lib/sound';
import { GameLobbyModal, GameInfo } from '@/components/activities/GameLobbyModal';
import { QuestionModal } from '@/components/activities/QuestionModal';
import { QuotesModal } from '@/components/activities/QuotesModal';
import { TruthOrDareModal } from '@/components/activities/TruthOrDareModal';
import { DilemmaModal } from '@/components/activities/DilemmaModal';
import { VibeLoungesModal } from '@/components/activities/VibeLoungesModal';

const POPULAR_TAGS = [
  '#philosophy',
  '#travelstories',
  '#latenightvibes',
  '#gaming',
  '#musictherapy',
  '#indiegames',
  '#solitude',
  '#startups',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');

  // Modals state
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [isQuotesOpen, setIsQuotesOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [isTruthOrDareOpen, setIsTruthOrDareOpen] = useState(false);
  const [isDilemmasOpen, setIsDilemmasOpen] = useState(false);
  const [isVibesOpen, setIsVibesOpen] = useState(false);

  // Filtered users for live search
  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName.toLowerCase().includes(query.toLowerCase()) ||
      u.location?.toLowerCase().includes(query.toLowerCase()) ||
      u.interests?.some((i) => i.toLowerCase().includes(query.toLowerCase()))
  );

  const handleOpenGames = () => {
    sound.playPop(520);
    setSelectedGame(null); // Shows game selector in modal
    setIsGamesOpen(true);
  };

  const handleOpenQuotes = () => {
    sound.playHeart();
    setIsQuotesOpen(true);
  };

  const handleOpenQuestions = () => {
    sound.playMatchChord();
    setIsQuestionsOpen(true);
  };

  const handleOpenTruthOrDare = () => {
    sound.playSpinTick();
    setIsTruthOrDareOpen(true);
  };

  const handleOpenDilemmas = () => {
    sound.playPop(480);
    setIsDilemmasOpen(true);
  };

  const handleOpenVibes = () => {
    sound.playMatchChord();
    setIsVibesOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-24 md:pb-12">
      {/* 1. TOP STICKY SEARCH BAR (Matches Wireframe IMG_20260928_203535: "Search for Users") */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 py-3.5 shadow-xs">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, @handle, #tags, or cities..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-secondary/60 border-border/80 text-sm text-foreground focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/70 shadow-xs"
            />
            {query && (
              <button
                onClick={() => {
                  sound.playPop(340);
                  setQuery('');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* ============================================================ */}
        {/* CASE A: LIVE SEARCH RESULTS (When query is not empty) */}
        {/* ============================================================ */}
        {query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
              <span>Results for &ldquo;{query}&rdquo;</span>
              <span>{filteredUsers.length} found</span>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="space-y-2.5">
                {filteredUsers.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs hover:border-border transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar size="lg" fallback={user.avatar} className="ring-2 ring-border/50 text-xl" />
                        {user.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {user.displayName}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10 shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        {user.location && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{user.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href="/radar">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs h-8 px-3 gap-1 border-border/80 hover:bg-secondary"
                        >
                          <Radio className="w-3 h-3 text-primary animate-pulse" />
                          <span>Radar</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-3.5 gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-muted-foreground">
                <p className="text-sm font-semibold">No creators found matching &ldquo;{query}&rdquo;</p>
                <p className="text-xs mt-1">Try exploring community activities below.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* CASE B: WIREFRAME-EXACT 2-COLUMN ACTIVITIES GRID */}
        {/* Matches notebook drawing IMG_20260928_203535.jpg: */}
        {/* Section title "Activities" + 2 columns of 3 rounded cards */}
        {/* ============================================================ */}
        {query.trim().length === 0 && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  Activities
                </h1>
                <p className="text-xs text-muted-foreground">
                  Real-time spaces to play, share & connect with strangers.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>1,482 Active</span>
              </span>
            </div>

            {/* 2-Column Grid (Direct match with user wireframe: [GAMES] [Quotes] [Questions] etc.) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* CARD 1: GAMES */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenGames}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-indigo-500/15 via-card to-card border border-indigo-500/30 hover:border-indigo-500/60 shadow-xs hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] transition-all cursor-pointer flex flex-col justify-between h-40 sm:h-44 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🎮
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    4 Games
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-indigo-400 transition-colors">
                    GAMES
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    Chess, Ludo, Neon Tic-Tac-Toe & Trivia Arena.
                  </p>
                </div>
              </motion.div>

              {/* CARD 2: QUOTES */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenQuotes}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-violet-500/15 via-card to-card border border-violet-500/30 hover:border-violet-500/60 shadow-xs hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition-all cursor-pointer flex flex-col justify-between h-40 sm:h-44 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    Daily
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-violet-400 transition-colors">
                    Quotes
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    Aesthetic thoughts, bookmarks & raw community stories.
                  </p>
                </div>
              </motion.div>

              {/* CARD 3: QUESTIONS */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenQuestions}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/15 via-card to-card border border-amber-500/30 hover:border-amber-500/60 shadow-xs hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex flex-col justify-between h-40 sm:h-44 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ❓
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Anonymous
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-amber-400 transition-colors">
                    Questions
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    Daily secret prompt & unfiltered answers from strangers.
                  </p>
                </div>
              </motion.div>

              {/* CARD 4: TRUTH OR DARE */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenTruthOrDare}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-rose-500/15 via-card to-card border border-rose-500/30 hover:border-rose-500/60 shadow-xs hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all cursor-pointer flex flex-col justify-between h-40 sm:h-44 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🔥
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Spicy
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-rose-400 transition-colors">
                    Truth or Dare
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    Spin the bottle & reveal confidential confessions.
                  </p>
                </div>
              </motion.div>

              {/* CARD 5: DILEMMAS */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenDilemmas}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-cyan-500/15 via-card to-card border border-cyan-500/30 hover:border-cyan-500/60 shadow-xs hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all cursor-pointer flex flex-col justify-between h-40 sm:h-44 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Live Polls
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-cyan-400 transition-colors">
                    Dilemmas
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    Would You Rather dilemma debates with live percentages.
                  </p>
                </div>
              </motion.div>

              {/* CARD 6: VIBE LOUNGES */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenVibes}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-emerald-500/15 via-card to-card border border-emerald-500/30 hover:border-emerald-500/60 shadow-xs hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all cursor-pointer flex flex-col justify-between h-40 sm:h-44 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Orbit Lounges
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground group-hover:text-emerald-400 transition-colors">
                    Vibe Lounges
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    Midnight deep talks, casual coffee & co-presence rooms.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Trending Tags Row */}
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                Trending Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      sound.playPop(440);
                      setQuery(tag.slice(1));
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-card hover:bg-secondary border border-border/80 text-xs font-semibold text-foreground hover:text-primary transition-all shadow-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* FULL ACTIVITY MODALS (Clean, focused interactive spaces) */}
      {/* ============================================================ */}

      {/* 1. Games Arena Modal (Chess, Ludo, Tic-Tac-Toe, Trivia + Bot/Friends/Strangers) */}
      <GameLobbyModal
        game={selectedGame}
        isOpen={isGamesOpen}
        onClose={() => {
          setIsGamesOpen(false);
          setSelectedGame(null);
        }}
      />

      {/* 2. Quotes & Stories Modal */}
      <QuotesModal
        isOpen={isQuotesOpen}
        onClose={() => setIsQuotesOpen(false)}
      />

      {/* 3. Daily Question Chamber Modal */}
      <QuestionModal
        isOpen={isQuestionsOpen}
        onClose={() => setIsQuestionsOpen(false)}
      />

      {/* 4. Truth or Dare & Bottle Spin Modal */}
      <TruthOrDareModal
        isOpen={isTruthOrDareOpen}
        onClose={() => setIsTruthOrDareOpen(false)}
      />

      {/* 5. Live Dilemmas & Would You Rather Modal */}
      <DilemmaModal
        isOpen={isDilemmasOpen}
        onClose={() => setIsDilemmasOpen(false)}
      />

      {/* 6. Real-time Vibe Lounges Modal */}
      <VibeLoungesModal
        isOpen={isVibesOpen}
        onClose={() => setIsVibesOpen(false)}
      />
    </div>
  );
}
