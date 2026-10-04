import { create } from 'zustand';
import type { RealtimeUser, RealtimeMessage } from '@/lib/realtime/types';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';

interface RealtimeStoreState {
  isConnected: boolean;
  isReconnecting: boolean;
  onlineCount: number;
  matchState: 'idle' | 'searching' | 'matched';
  activeRoomId: string | null;
  partner: RealtimeUser | null;
  messages: RealtimeMessage[];
  isPartnerTyping: boolean;
  hasStrangerLeft: boolean;
  friendRequestReceived: boolean;
  friendRequestAccepted: boolean;
  rateLimitCooldownUntil: number | null;

  // Actions
  connect: (user: RealtimeUser) => void;
  disconnect: () => void;
  startMatchmaking: (user: RealtimeUser) => Promise<void>;
  cancelMatchmaking: (userId: string) => Promise<void>;
  sendMessage: (text: string, user: RealtimeUser) => Promise<boolean>;
  setTyping: (isTyping: boolean) => Promise<void>;
  skipStranger: (user: RealtimeUser) => Promise<void>;
  sendFriendRequest: (user: RealtimeUser) => Promise<void>;
  acceptFriendRequest: (user: RealtimeUser) => Promise<void>;
  blockUser: (userId: string, targetUserId: string) => Promise<void>;
  reportUser: (userId: string, targetUserId: string, reason?: string) => Promise<void>;
  syncRoomHistory: (roomId: string) => Promise<void>;
}

let eventSourceInstance: EventSource | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let currentUserRef: RealtimeUser | null = null;
let isExplicitlyDisconnected = false;
let isSkippingTransition = false;

export const useRealtimeStore = create<RealtimeStoreState>((set, get) => ({
  isConnected: false,
  isReconnecting: false,
  onlineCount: 0,
  matchState: 'idle',
  activeRoomId: null,
  partner: null,
  messages: [],
  isPartnerTyping: false,
  hasStrangerLeft: false,
  friendRequestReceived: false,
  friendRequestAccepted: false,
  rateLimitCooldownUntil: null,

  connect: (user: RealtimeUser) => {
    if (typeof window === 'undefined') return;
    isExplicitlyDisconnected = false;
    currentUserRef = user;

    if (eventSourceInstance) return;

    const url = `/api/realtime/stream?userId=${encodeURIComponent(user.id)}&username=${encodeURIComponent(
      user.username
    )}&displayName=${encodeURIComponent(user.displayName)}&avatar=${encodeURIComponent(user.avatar)}`;

    const es = new EventSource(url);
    eventSourceInstance = es;

    es.onopen = () => {
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      set({ isConnected: true, isReconnecting: false });
    };

    es.addEventListener('presence_sync', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.onlineCount !== undefined) {
          set({ onlineCount: data.onlineCount });
        }
      } catch (err) {
        console.warn('presence_sync parse error:', err);
      }
    });

    es.addEventListener('match_found', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        sound.playMatchChord();
        isSkippingTransition = false;

        set({
          matchState: 'matched',
          activeRoomId: data.roomId,
          partner: data.partner,
          messages: [
            {
              id: `welcome-${Date.now()}`,
              roomId: data.roomId,
              senderId: data.partner.id,
              senderName: data.partner.displayName,
              senderAvatar: data.partner.avatar,
              text: `Connected with @${data.partner.username}! Say hello ✨`,
              timestamp: new Date().toISOString(),
              status: 'delivered',
            },
          ],
          hasStrangerLeft: false,
          isPartnerTyping: false,
          friendRequestReceived: false,
          friendRequestAccepted: false,
        });

        // Sync room history
        get().syncRoomHistory(data.roomId);
      } catch (err) {
        console.warn('match_found parse error:', err);
      }
    });

    es.addEventListener('chat_message', (e: MessageEvent) => {
      try {
        const msg: RealtimeMessage = JSON.parse(e.data);
        sound.playMessageReceived();
        set((state) => {
          const existingIdx = state.messages.findIndex((m) => m.id === msg.id);
          if (existingIdx !== -1) {
            const updated = [...state.messages];
            updated[existingIdx] = { ...msg, status: 'delivered' };
            return { messages: updated, isPartnerTyping: false };
          }
          return {
            messages: [...state.messages, { ...msg, status: 'delivered' }],
            isPartnerTyping: false,
          };
        });
      } catch (err) {
        console.warn('chat_message parse error:', err);
      }
    });

    es.addEventListener('typing', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        set({ isPartnerTyping: !!data.isTyping });
      } catch (err) {
        console.warn('typing parse error:', err);
      }
    });

    es.addEventListener('stranger_left', () => {
      sound.playPop(300);
      set({ hasStrangerLeft: true, isPartnerTyping: false });
    });

    es.addEventListener('connection_request', () => {
      sound.playHeart();
      set({ friendRequestReceived: true });
    });

    es.addEventListener('connection_accepted', () => {
      sound.playWinFanfare();
      set({ friendRequestAccepted: true });
    });

    es.onerror = () => {
      if (isExplicitlyDisconnected) return;

      set({ isConnected: false, isReconnecting: true });
      if (eventSourceInstance) {
        eventSourceInstance.close();
        eventSourceInstance = null;
      }

      if (!reconnectTimer && currentUserRef) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          if (!isExplicitlyDisconnected && currentUserRef) {
            get().connect(currentUserRef);
          }
        }, delay);
      }
    };
  },

  disconnect: () => {
    isExplicitlyDisconnected = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    reconnectAttempts = 0;
    currentUserRef = null;

    if (eventSourceInstance) {
      eventSourceInstance.close();
      eventSourceInstance = null;
    }
    set({ isConnected: false, isReconnecting: false, matchState: 'idle' });
  },

  syncRoomHistory: async (roomId: string) => {
    try {
      const res = await fetch(`/api/realtime/history?roomId=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          set((state) => {
            const existingIds = new Set(state.messages.map((m) => m.id));
            const newMessages = data.messages.filter((m: RealtimeMessage) => !existingIds.has(m.id));
            if (newMessages.length === 0) return state;
            return { messages: [...state.messages, ...newMessages] };
          });
        }
      }
    } catch (err) {
      console.warn('syncRoomHistory error:', err);
    }
  },

  startMatchmaking: async (user: RealtimeUser) => {
    sound.playPop(480);
    set({
      matchState: 'searching',
      messages: [],
      activeRoomId: null,
      partner: null,
      hasStrangerLeft: false,
      friendRequestReceived: false,
      friendRequestAccepted: false,
    });

    try {
      const res = await fetch('/api/realtime/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_queue',
          userId: user.id,
          userMeta: user,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to enter matchmaking orbit.');
        set({ matchState: 'idle' });
      }
    } catch {
      toast.error('Connection error. Please try again.');
      set({ matchState: 'idle' });
    }
  },

  cancelMatchmaking: async (userId: string) => {
    sound.playPop(340);
    set({ matchState: 'idle' });
    try {
      await fetch('/api/realtime/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave_queue', userId }),
      });
    } catch (err) {
      console.warn('cancelMatchmaking error:', err);
    }
  },

  sendMessage: async (text: string, user: RealtimeUser) => {
    const { activeRoomId, rateLimitCooldownUntil } = get();
    if (!activeRoomId || !text.trim()) return false;

    // Check rate-limit cooldown
    if (rateLimitCooldownUntil && Date.now() < rateLimitCooldownUntil) {
      const remainingSec = Math.ceil((rateLimitCooldownUntil - Date.now()) / 1000);
      toast.warning(`Please wait ${remainingSec}s before sending another message.`);
      return false;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: RealtimeMessage = {
      id: tempId,
      roomId: activeRoomId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
    }));
    sound.playMessageSent();

    try {
      const res = await fetch('/api/realtime/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          userId: user.id,
          roomId: activeRoomId,
          userMeta: user,
          text: text.trim(),
        }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const cooldownMs = data.retryAfterMs || 3000;
        set((state) => ({
          rateLimitCooldownUntil: Date.now() + cooldownMs,
          messages: state.messages.map((m) =>
            m.id === tempId ? { ...m, status: 'failed' } : m
          ),
        }));
        toast.warning(data.error || 'Rate limit exceeded! Please slow down.');
        return false;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === tempId ? { ...m, status: 'failed' } : m
          ),
        }));
        toast.error(data.error || 'Failed to send message.');
        return false;
      }

      const data = await res.json();
      const serverMessage: RealtimeMessage = data.message;
      if (serverMessage) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === tempId ? { ...serverMessage, status: 'delivered' } : m
          ),
        }));
      }
      return true;
    } catch {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId ? { ...m, status: 'failed' } : m
        ),
      }));
      toast.error('Network error. Check connection.');
      return false;
    }
  },

  setTyping: async (isTyping: boolean) => {
    const { activeRoomId, partner } = get();
    if (!activeRoomId) return;
    try {
      await fetch('/api/realtime/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'typing',
          userId: partner ? partner.id : 'me',
          roomId: activeRoomId,
          isTyping,
        }),
      });
    } catch {}
  },

  skipStranger: async (user: RealtimeUser) => {
    if (isSkippingTransition) return;
    isSkippingTransition = true;

    const { activeRoomId } = get();
    if (activeRoomId) {
      try {
        await fetch('/api/realtime/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'skip_room',
            userId: user.id,
            roomId: activeRoomId,
          }),
        });
      } catch (err) {
        console.warn('skip_room fetch error:', err);
      }
    }

    // Immediately initiate new search
    get().startMatchmaking(user);
    setTimeout(() => {
      isSkippingTransition = false;
    }, 800);
  },

  sendFriendRequest: async (user: RealtimeUser) => {
    const { activeRoomId } = get();
    sound.playHeart();
    if (activeRoomId) {
      try {
        const res = await fetch('/api/realtime/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_friend_request',
            userId: user.id,
            roomId: activeRoomId,
            userMeta: user,
          }),
        });
        if (!res.ok) {
          toast.error('Unable to send connection request.');
        } else {
          toast.success('Connection request sent! 🤝');
        }
      } catch {}
    }
  },

  acceptFriendRequest: async (user: RealtimeUser) => {
    const { activeRoomId } = get();
    sound.playWinFanfare();
    set({ friendRequestAccepted: true });
    if (activeRoomId) {
      try {
        const res = await fetch('/api/realtime/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'accept_friend_request',
            userId: user.id,
            roomId: activeRoomId,
            userMeta: user,
          }),
        });
        if (res.ok) {
          toast.success('Connected as friends! 🎉');
        }
      } catch {}
    }
  },

  blockUser: async (userId: string, targetUserId: string) => {
    const { activeRoomId } = get();
    sound.playPop(340);
    set({ matchState: 'idle', activeRoomId: null, partner: null, messages: [] });
    try {
      const res = await fetch('/api/realtime/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block_user',
          userId,
          targetUserId,
          roomId: activeRoomId,
        }),
      });
      if (res.ok) {
        toast.success('User blocked permanently from your orbits.');
      }
    } catch {}
  },

  reportUser: async (userId: string, targetUserId: string, reason?: string) => {
    const { activeRoomId } = get();
    sound.playPop(340);
    set({ matchState: 'idle', activeRoomId: null, partner: null, messages: [] });
    try {
      const res = await fetch('/api/realtime/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_user',
          userId,
          targetUserId,
          roomId: activeRoomId,
          reason,
        }),
      });
      if (res.ok) {
        toast.success('Report submitted. Safe community guaranteed.');
      }
    } catch {}
  },
}));
