'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { sound } from '@/lib/sound';
import { getConversations } from '@/lib/mock/conversations';
import type { Conversation, Message } from '@/types';
import { CURRENT_USER } from '@/lib/mock';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { useConnectionsStore } from '@/store/connections';
import { useAuthStore } from '@/store/auth';

const MomentsModal = dynamic(
  () => import('@/components/chat/MomentsModal').then((m) => m.MomentsModal),
  { ssr: false }
);
const RequestsModal = dynamic(
  () => import('@/components/chat/RequestsModal').then((m) => m.RequestsModal),
  { ssr: false }
);
const SharedVaultModal = dynamic(
  () => import('@/components/chat/SharedVaultModal').then((m) => m.SharedVaultModal),
  { ssr: false }
);

export default function MasterChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [vanishMode, setVanishMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Modals
  const [showMomentsModal, setShowMomentsModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Connections store
  const { connections, addConnection } = useConnectionsStore();
  const { user } = useAuthStore();
  const myUser = user || CURRENT_USER;

  useEffect(() => {
    const baseChats = getConversations();

    // Map connections from Radar / Requests into conversation threads
    const dynamicChats: Conversation[] = connections.map((conn) => {
      const existing = baseChats.find((bc) =>
        bc.participants.some((p) => p.id === conn.user.id)
      );
      if (existing) return existing;

      return {
        id: `conv-${conn.user.id}`,
        participants: [myUser, conn.user],
        messages: [
          {
            id: `m-init-${conn.user.id}`,
            senderId: conn.user.id,
            receiverId: myUser.id,
            content: `Connected via Phryvos Serendipity ✨ Say hello!`,
            type: 'text',
            timestamp: conn.connectedAt || new Date().toISOString(),
            isRead: true,
          },
        ],
        unreadCount: 0,
        lastMessage: {
          id: `m-init-${conn.user.id}`,
          senderId: conn.user.id,
          receiverId: myUser.id,
          content: conn.lastMessage || 'Connected via Serendipity ✨',
          type: 'text',
          timestamp: conn.lastMessageAt || conn.connectedAt || new Date().toISOString(),
          isRead: true,
        },
        isTyping: false,
      };
    });

    // Merge without duplicates
    const all = [...dynamicChats];
    baseChats.forEach((bc) => {
      if (!all.some((c) => c.id === bc.id)) {
        all.push(bc);
      }
    });

    setConversations(all);
  }, [connections, myUser]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages);
    }
  }, [selectedConversation]);

  // Handle Select Conversation
  const handleSelectConv = (conv: Conversation) => {
    sound.playPop(480);
    setSelectedConversation(conv);
  };

  // Send message in 1-on-1 chat
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !selectedConversation) return;

    sound.playMessageSent();
    const other = selectedConversation.participants.find((p) => p.id !== 'me')!;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: 'me',
      receiverId: other.id,
      content: text.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: newMsg, messages: [...c.messages, newMsg] }
          : c
      )
    );
    setReplyingTo(null);
    setIsTyping(true);

    // Simulated stranger response
    setTimeout(() => {
      setIsTyping(false);
      sound.playMessageReceived();
      const replies = [
        'Haha totally! That makes so much sense.',
        'I was literally just thinking about that earlier today! ✨',
        'That sounds super interesting! How long have you been doing that?',
        'Count me in! Let’s definitely talk more about this.',
        'Love that perspective! 🙌',
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];

      const incomingMsg: Message = {
        id: `m_${Date.now() + 1}`,
        senderId: other.id,
        receiverId: 'me',
        content: replyText,
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: true,
      };

      setMessages((prev) => [...prev, incomingMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: incomingMsg, messages: [...c.messages, incomingMsg] }
            : c
        )
      );
    }, 1400);
  };

  const otherUser =
    selectedConversation?.participants.find((p) => p.id !== 'me') || myUser;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-background text-foreground transition-colors overflow-hidden">
      {/* Modals */}
      <MomentsModal
        isOpen={showMomentsModal}
        onClose={() => setShowMomentsModal(false)}
        onSelectChat={(username) => {
          const found = conversations.find((c) =>
            c.participants.some((p) => p.username === username)
          );
          if (found) setSelectedConversation(found);
        }}
      />

      <RequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        onAccept={(id, item) => {
          sound.playMatchChord();
          if (item) {
            addConnection({
              id: item.id,
              username: item.username,
              displayName: item.name,
              avatar: item.avatar,
              location: item.location,
              bio: item.bio,
              interests: [item.tag.replace('#', '')],
            });
          }
        }}
      />

      {selectedConversation && (
        <SharedVaultModal
          isOpen={showVaultModal}
          onClose={() => setShowVaultModal(false)}
          friendName={otherUser.displayName}
        />
      )}

      {/* LEFT COLUMN: FRIENDS / ROOMS HUB (Hidden on mobile if chat open) */}
      <ConversationSidebar
        conversations={conversations}
        selectedConversationId={selectedConversation?.id || null}
        onSelectConversation={handleSelectConv}
        onOpenMoments={() => setShowMomentsModal(true)}
        onOpenRequests={() => setShowRequestsModal(true)}
        onOpenSettings={() => sound.playPop(400)}
        className={selectedConversation ? 'hidden md:flex' : 'flex'}
      />

      {/* RIGHT COLUMN: ACTIVE 1-ON-1 CHAT WINDOW */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col h-full bg-background relative">
          <ChatHeader
            otherUser={otherUser}
            vanishMode={vanishMode}
            onToggleVanishMode={() => setVanishMode((v) => !v)}
            onBack={() => setSelectedConversation(null)}
            onOpenVault={() => setShowVaultModal(true)}
          />

          <ChatMessageList
            messages={messages}
            otherUser={otherUser}
            isTyping={isTyping}
            onReplyTo={(msg) => setReplyingTo(msg)}
          />

          <ChatInputBar
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      ) : (
        /* Empty desktop placeholder when no chat selected */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground bg-background">
          <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-3xl mb-4 border border-border shadow-xs">
            💬
          </div>
          <h2 className="text-lg font-bold text-foreground">Phryvos Messenger</h2>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Pick a conversation from the Friends list or jump into a public Lounge in Rooms!
          </p>
        </div>
      )}
    </div>
  );
}
