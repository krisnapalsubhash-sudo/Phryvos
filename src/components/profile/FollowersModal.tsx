'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Sparkles } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock/users';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { sound } from '@/lib/sound';
import Link from 'next/link';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  userName?: string;
}

export function FollowersModal({ isOpen, onClose, initialTab = 'followers', userName = 'User' }: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    '1': true,
    '3': true,
  });

  const followersList = MOCK_USERS.slice(0, 6);
  const followingList = MOCK_USERS.slice(2, 7);

  const currentList = activeTab === 'followers' ? followersList : followingList;

  const filteredList = currentList.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFollow = (userId: string) => {
    const isNowFollowing = !followingMap[userId];
    setFollowingMap((prev) => ({ ...prev, [userId]: isNowFollowing }));
    if (isNowFollowing) {
      sound.playHeart();
    } else {
      sound.playPop(340);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <h3 className="text-sm font-bold text-foreground truncate">@{userName}'s Network</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-2xl my-3 shrink-0">
            <button
              onClick={() => {
                setActiveTab('followers');
                sound.playPop(420);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'followers' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Followers ({followersList.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('following');
                sound.playPop(480);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'following' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Following ({followingList.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full h-8.5 rounded-xl bg-secondary/40 border border-border/60 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* User List */}
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {filteredList.map((user) => {
              const isFollowing = !!followingMap[user.id];
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-secondary/30 transition-colors"
                >
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    <Avatar size="md" fallback={user.avatar} className="ring-1 ring-border/50 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </Link>

                  <Button
                    onClick={() => toggleFollow(user.id)}
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    className={`rounded-full h-7 text-xs px-3 gap-1 shrink-0 ${
                      isFollowing
                        ? 'border border-border/70 text-foreground'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No users found matching "{searchQuery}"
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
