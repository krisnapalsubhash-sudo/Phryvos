'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Settings,
  Plus,
  Users,
  Radio,
  MoreVertical,
  Dice5,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import type { Conversation } from '@/types';
import { toast } from 'sonner';

export interface PublicRoom {
  id: string;
  name: string;
  emoji: string;
  topic: string;
  onlineCount: number;
  tags: string[];
  avatars: string[];
}

export const PUBLIC_ROOMS: PublicRoom[] = [
  {
    id: 'room-1',
    name: 'Late Night Thoughts',
    emoji: '🌙',
    topic: 'Venting, philosophy, and midnight talks with strangers',
    onlineCount: 38,
    tags: ['#Chill', '#NightOwl'],
    avatars: ['😊', '🦊', '⚡', '🌸'],
  },
  {
    id: 'room-2',
    name: 'Gaming Squad & LFG',
    emoji: '🎮',
    topic: 'Valorant, Minecraft, GTA, and squad matchmaking',
    onlineCount: 64,
    tags: ['#Gaming', '#Multiplayer'],
    avatars: ['👾', '🔥', '🎮', '🦁'],
  },
  {
    id: 'room-3',
    name: 'Lofi & Study Together',
    emoji: '🎧',
    topic: 'Quiet focus lounge with ambient beats playing',
    onlineCount: 42,
    tags: ['#Music', '#Study'],
    avatars: ['💻', '📖', '☕', '🐱'],
  },
  {
    id: 'room-4',
    name: 'Anime & Manga Club',
    emoji: '⛩️',
    topic: 'Discussing weekly episodes, recommendations & theories',
    onlineCount: 29,
    tags: ['#Anime', '#Otaku'],
    avatars: ['🐲', '🦋', '⚡', '🦄'],
  },
  {
    id: 'room-5',
    name: 'Global Culture Exchange',
    emoji: '🌍',
    topic: 'Language learners and travelers sharing stories',
    onlineCount: 51,
    tags: ['#Travel', '#Language'],
    avatars: ['🌍', '🗼', '🍕', '🗽'],
  },
];

const CO_PRESENCE_STATUSES = [
  '🎧 Listening to Midnight Lofi',
  '🎮 In a Valorant match',
  '🌙 Up late thinking',
  '☕ Coffee break',
  'Active now',
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onOpenMoments: () => void;
  onOpenRequests: () => void;
  onOpenSettings: () => void;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onOpenMoments,
  onOpenRequests,
  onOpenSettings,
  className = '',
}: ConversationSidebarProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'rooms'>('friends');
  const [friendSearch, setFriendSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  const handleJoinRandomRoom = () => {
    sound.playMatchChord();
    const random = PUBLIC_ROOMS[Math.floor(Math.random() * PUBLIC_ROOMS.length)];
    toast.success(`Joining "${random.name}" with ${random.onlineCount} members!`);
  };

  const filteredConversations = conversations.filter((c) => {
    const other = c.participants.find((p) => p.id !== 'me');
    return other?.displayName.toLowerCase().includes(friendSearch.toLowerCase());
  });

  const filteredRooms = PUBLIC_ROOMS.filter(
    (r) =>
      r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.topic.toLowerCase().includes(roomSearch.toLowerCase())
  );

  return (
    <div className={`w-full md:w-80 lg:w-96 border-r border-border/70 flex flex-col bg-card/40 transition-all ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 glass-panel">
        {/* Main Tabs */}
        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => {
              sound.playPop(440);
              setActiveTab('friends');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'friends'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Friends
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playPop(440);
              setActiveTab('rooms');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rooms'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rooms
          </button>
        </div>

        {/* Top Right Action Icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              sound.playPop(520);
              onOpenMoments();
            }}
            className="btn-icon rounded-full hover:bg-secondary border border-border/50 text-amber-500 hover:text-amber-400 relative p-2"
            title="Connection Moments & Milestones"
            aria-label="Moments"
          >
            <Sparkles className="w-4 h-4 fill-amber-500/20" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPop(400);
              onOpenSettings();
            }}
            className="btn-icon rounded-full hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground p-2"
            title="Chat Settings"
            aria-label="Chat Settings"
          >
            <Settings className="w-4 h-4 hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-border/50 bg-background/50">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={activeTab === 'friends' ? friendSearch : roomSearch}
            onChange={(e) =>
              activeTab === 'friends'
                ? setFriendSearch(e.target.value)
                : setRoomSearch(e.target.value)
            }
            placeholder={
              activeTab === 'friends'
                ? 'Search chats & friends...'
                : 'Search public lounges & rooms...'
            }
            className="w-full pl-10 pr-4 h-9.5 text-xs rounded-xl bg-secondary/60 hover:bg-secondary/80 focus:bg-background border border-border/60 focus:border-primary/50 outline-none transition-all"
          />
        </div>
      </div>

      {/* TAB 1: FRIENDS LIST */}
      {activeTab === 'friends' && (
        <div className="flex-1 overflow-y-auto relative divide-y divide-border/20">
          {/* Active vibe bubbles strip */}
          <div className="p-3 border-b border-border/30 overflow-x-auto no-scrollbar flex items-center gap-3 bg-secondary/10">
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center text-primary text-lg">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">My Vibe</span>
            </div>

            {conversations.slice(0, 5).map((conv) => {
              const other = conv.participants.find((p) => p.id !== 'me')!;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl border-2 border-primary group-hover:scale-105 transition-transform shadow-xs">
                      {other.avatar}
                    </div>
                    {other.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-foreground truncate max-w-[54px]">
                    {other.displayName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Conversation Threads */}
          {filteredConversations.map((conv, index) => {
            const other = conv.participants.find((p) => p.id !== 'me')!;
            const isActive = selectedConversationId === conv.id;
            const statusText = CO_PRESENCE_STATUSES[index % CO_PRESENCE_STATUSES.length];

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-all text-left group ${
                  isActive
                    ? 'bg-primary/10 border-l-4 border-l-primary'
                    : 'hover:bg-secondary/40'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl border border-border shadow-xs group-hover:scale-102 transition-transform">
                    {other.avatar}
                  </div>
                  {other.isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-bold text-sm truncate ${
                        isActive ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {other.displayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                      {conv.lastMessage ? timeAgo(conv.lastMessage.timestamp) : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-primary/80 font-medium truncate">
                      {statusText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage?.content || 'Say hello...'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Floating Requests Badge */}
          <div className="sticky bottom-4 right-4 flex justify-end px-4 pointer-events-none">
            <button
              type="button"
              onClick={() => {
                sound.playPop(520);
                onOpenRequests();
              }}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Requests</span>
              <span className="w-4.5 h-4.5 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ROOMS LIST */}
      {activeTab === 'rooms' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 relative">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="p-4 rounded-3xl bg-secondary/30 hover:bg-secondary/50 border border-border/70 transition-all group flex flex-col gap-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center text-2xl shadow-xs">
                    {room.emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>{room.onlineCount} online</span>
                    </div>
                  </div>
                </div>

                <button className="btn-icon w-7 h-7 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                {room.topic}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <div className="flex items-center gap-1">
                  {room.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex -space-x-1.5">
                  {room.avatars.map((av, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-secondary border border-card flex items-center justify-center text-xs"
                    >
                      {av}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playMatchChord();
                  toast.success(`Entering ${room.name}!`);
                }}
                className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 mt-1"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Join Lounge</span>
              </button>
            </div>
          ))}

          <div className="sticky bottom-4 right-4 flex justify-end pointer-events-none pt-4">
            <button
              type="button"
              onClick={handleJoinRandomRoom}
              className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              <Dice5 className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              <span>+ Join Random Room</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
