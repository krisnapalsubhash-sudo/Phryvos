'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Trophy, UserPlus, Zap, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface NotificationItem {
  id: string;
  type: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const ICON_MAP: Record<string, typeof Heart> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: UserPlus,
  MENTION: Bell,
  ACHIEVEMENT: Trophy,
  SYSTEM: Zap,
  MESSAGE: MessageCircle,
  MESSAGE_REQUEST: MessageCircle,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.notifications) {
            setNotifications(data.notifications);
          }
        } else {
          setError('Failed to load notifications');
        }
      } catch (err) {
        console.error('Notifications fetch error:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ readAll: true }),
        headers: { 'Content-Type': 'application/json' },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-destructive/30 text-destructive">
            <p className="text-sm font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-muted-foreground">
            <p className="text-sm font-semibold">No notifications yet</p>
            <p className="text-xs mt-1">When someone interacts with you, you&apos;ll see it here.</p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const Icon = ICON_MAP[notif.type.toUpperCase()] || Bell;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markRead(notif.id)}
                className={`bg-card border rounded-2xl p-4 flex items-center gap-3.5 transition-all shadow-xs hover:border-border cursor-pointer ${
                  !notif.isRead ? 'border-primary/40 bg-primary/5' : 'border-border/70'
                }`}
              >
                <Avatar size="sm" fallback={notif.actor.avatar} className="shrink-0" />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-foreground">
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mr-2 inline-block" />}
                    <span className="font-semibold text-foreground mr-1">{notif.actor.displayName}</span>
                    <span className="text-muted-foreground">{notif.body}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">{timeAgo(notif.createdAt)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}
