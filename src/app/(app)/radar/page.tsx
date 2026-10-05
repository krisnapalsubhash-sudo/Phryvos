'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRealtimeStore } from '@/store/realtime';
import { useConnectionsStore } from '@/store/connections';
import type { RealtimeUser } from '@/lib/realtime/types';
import dynamic from 'next/dynamic';
import { sound } from '@/lib/sound';

const TicTacToeModal = dynamic(
  () => import('@/components/chat/TicTacToeModal').then((m) => m.TicTacToeModal),
  { ssr: false }
);
const WordMysteryModal = dynamic(
  () => import('@/components/chat/WordMysteryModal').then((m) => m.WordMysteryModal),
  { ssr: false }
);
const RadarChatView = dynamic(
  () => import('@/components/radar/RadarChatView').then((m) => m.RadarChatView),
  { ssr: false }
);
const RadarSettingsDrawer = dynamic(
  () => import('@/components/radar/RadarSettingsDrawer').then((m) => m.RadarSettingsDrawer),
  { ssr: false }
);

const RadarOrbitalCanvas = dynamic(
  () => import('@/components/radar/RadarOrbitalCanvas').then((m) => m.RadarOrbitalCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black/40">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    ),
  }
);

export default function RadarPage() {
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  // Filters & Custom Tags State
  const [selectedTag, setSelectedTag] = useState<string>('Chill');
  const [selectedCountry, setSelectedCountry] = useState<string>('Global');
  const [customTags, setCustomTags] = useState<string[]>(['Chill', 'Gaming', 'Music', 'Tech']);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // In-room mini games modals
  const [showGameModal, setShowGameModal] = useState(false);
  const [showMysteryModal, setShowMysteryModal] = useState(false);

  const { addConnection } = useConnectionsStore();

  const {
    isConnected,
    isReconnecting,
    onlineCount,
    matchState,
    partner,
    messages,
    isPartnerTyping,
    hasStrangerLeft,
    friendRequestReceived,
    friendRequestAccepted,
    connect,
    disconnect,
    startMatchmaking,
    cancelMatchmaking,
    sendMessage,
    setTyping,
    skipStranger,
    sendFriendRequest,
    acceptFriendRequest,
    blockUser,
    reportUser,
  } = useRealtimeStore();

  const currentRealtimeUser: RealtimeUser = {
    id: user?.id || 'anonymous',
    username: user?.username || 'stranger',
    displayName: user?.displayName || 'Stranger',
    avatar: user?.avatar || '😊',
    location: user?.location || 'Orbit',
    interests: user?.interests || ['Chill'],
    ageGroup: user?.ageGroup,
    languages: (user as any)?.languages || [],
    gameTags: (user as any)?.gameTags || [],
    hobbyTags: (user as any)?.hobbyTags || [],
    topicTags: (user as any)?.topicTags || [],
  };

  useEffect(() => {
    if (!user?.id) return;

    connect(currentRealtimeUser);

    return () => {
      cancelMatchmaking(currentRealtimeUser.id);
      disconnect();
    };
  }, [user?.id]);

  // Don't render until auth is hydrated and user is authenticated
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your orbit...</p>
        </div>
      </div>
    );
  }

  const isChatActive = matchState === 'matched' && partner !== null;

  const handleStartMatch = () => {
    startMatchmaking(currentRealtimeUser);
  };

  const handleCancelMatch = () => {
    sound.playPop(340);
    cancelMatchmaking(currentRealtimeUser.id);
  };

  const handleNextStranger = () => {
    sound.playPop(420);
    skipStranger(currentRealtimeUser);
  };

  const handleLeaveChat = () => {
    sound.playPop(340);
    cancelMatchmaking(currentRealtimeUser.id);
  };

  const handleSendFriendReq = () => {
    sendFriendRequest(currentRealtimeUser);
    if (partner) {
      addConnection({
        id: partner.id,
        username: partner.username,
        displayName: partner.displayName,
        avatar: partner.avatar,
        location: partner.location,
        interests: partner.interests,
      });
    }
  };

  const handleAcceptFriendReq = () => {
    acceptFriendRequest(currentRealtimeUser);
    if (partner) {
      addConnection({
        id: partner.id,
        username: partner.username,
        displayName: partner.displayName,
        avatar: partner.avatar,
        location: partner.location,
        interests: partner.interests,
      });
    }
  };

  const handleAddCustomTag = (tag: string) => {
    if (!customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
      setSelectedTag(tag);
      sound.playPop(520);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col bg-background text-foreground transition-colors overflow-hidden">
      {/* 1. Radar Solar View when idle or searching */}
      {!isChatActive && (
        <RadarOrbitalCanvas
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          onlineCount={onlineCount}
          isSearching={matchState === 'searching'}
          onToggleSettings={() => setShowSettingsDrawer((s) => !s)}
          onStartMatch={handleStartMatch}
          onCancelMatch={handleCancelMatch}
        />
      )}

      {/* 2. Stranger Realtime Chat View when matched */}
      {isChatActive && (
        <RadarChatView
          partner={partner}
          currentRealtimeUser={currentRealtimeUser}
          messages={messages}
          isPartnerTyping={isPartnerTyping}
          hasStrangerLeft={hasStrangerLeft}
          friendRequestReceived={friendRequestReceived}
          friendRequestAccepted={friendRequestAccepted}
          onSendFriendRequest={handleSendFriendReq}
          onAcceptFriendRequest={handleAcceptFriendReq}
          onNextStranger={handleNextStranger}
          onLeaveChat={handleLeaveChat}
          onBlockUser={(targetId) => blockUser(currentRealtimeUser.id, targetId)}
          onReportUser={(targetId, reason) => reportUser(currentRealtimeUser.id, targetId, reason)}
          onSendMessage={(text) => sendMessage(text, currentRealtimeUser)}
          onSetTyping={(typing) => setTyping(typing)}
          onOpenGameModal={() => setShowGameModal(true)}
          onOpenMysteryModal={() => setShowMysteryModal(true)}
        />
      )}

      {/* 3. Settings & Filters Drawer */}
      <RadarSettingsDrawer
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        customTags={customTags}
        onAddCustomTag={handleAddCustomTag}
      />

      {/* 4. Anti-Awkwardness Tic-Tac-Toe Modal */}
      <TicTacToeModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        partnerName={partner?.displayName || 'Stranger'}
      />

      {/* 5. Anti-Awkwardness Word Mystery Modal */}
      <WordMysteryModal
        isOpen={showMysteryModal}
        onClose={() => setShowMysteryModal(false)}
        partnerName={partner?.displayName || 'Stranger'}
      />
    </div>
  );
}
