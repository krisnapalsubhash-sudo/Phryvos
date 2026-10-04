'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Trophy, UserPlus, Zap, Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationItem {
  id: number;
  type: string;
  icon: any;
  from?: string;
  text: string;
  time: string;
  unread: boolean;
}

const initialNotifications: NotificationItem[] = [
  { id: 1, type: 'message', icon: MessageCircle, from: 'Arjun Mehta', text: 'sent you a direct message', time: '2m ago', unread: true },
  { id: 2, type: 'connection', icon: UserPlus, from: 'Sarah Connor', text: 'started following you', time: '1h ago', unread: true },
  { id: 3, type: 'like', icon: Heart, from: 'Kenji Sato', text: 'liked your latest design post', time: '3h ago', unread: true },
  { id: 4, type: 'mention', icon: Bell, from: 'Maya Chen', text: 'mentioned you in a radar thread', time: '5h ago', unread: false },
  { id: 5, type: 'achievement', icon: Trophy, text: 'You unlocked the "Cosmic Navigator" badge! 🌟', time: '1d ago', unread: false },
  { id: 6, type: 'system', icon: Zap, text: 'Welcome to Phryvos! Your adaptive profile is all set.', time: '2d ago', unread: false },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifications);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifs.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-24 md:pb-12">
      {/* Header */}
      <div className="sticky top-16 z-30 glass-panel border-b border-border/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Activity & Notifications</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={markAllRead}
              className="rounded-full text-xs border-border/80 hover:bg-secondary gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-primary" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {notifs.map((notif, i) => {
          const Icon = notif.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card border rounded-2xl p-4 flex items-center gap-3.5 transition-all shadow-xs hover:border-border ${
                notif.unread ? 'border-primary/40 bg-primary/5' : 'border-border/70'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.unread
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-foreground">
                  {notif.from && <span className="font-semibold text-foreground mr-1">{notif.from}</span>}
                  <span className="text-muted-foreground">{notif.text}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">{notif.time}</p>
              </div>
              {notif.unread && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 ring-4 ring-primary/20" />
              )}
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}
