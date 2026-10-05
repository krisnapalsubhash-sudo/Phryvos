/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { sound } from '@/lib/sound';
import Link from 'next/link';
import type { User } from '@/types';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  userName?: string;
  profileUserId?: string;
}

interface ModalUser extends User {
  isFollowing?: boolean;
}

export function FollowersModal({ isOpen, onClose, initialTab = 'followers', userName = 'User', profileUserId }: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [users, setUsers] = useState<ModalUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !profileUserId) return;

    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = activeTab === 'followers'
          ? `/api/users/${profileUserId}/followers`
          : `/api/users/${profileUserId}/following`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.users) {
            setUsers(data.users);
          } else {
            setUsers([]);
          }
        } else {
          setError('Failed to load');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [isOpen, profileUserId, activeTab]);

  const filteredList = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h3 className="text-sm font-bold text-foreground truncate">@{userName}&apos;s Network</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
              aria-label="Close"
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
              Followers ({users.length})
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
              Following ({users.length})
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-xs text-destructive">{error}</div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searchQuery ? `No users found matching "${searchQuery}"` : 'No one yet'}
              </div>
            ) : (
              filteredList.map((user) => (
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
                    size="sm"
                    variant={user.isFollowing ? 'secondary' : 'primary'}
                    className={`rounded-full h-7 text-xs px-3 gap-1 shrink-0 ${
                      user.isFollowing
                        ? 'border border-border/70 text-foreground'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {user.isFollowing ? (
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
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
