'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Heart,
  MessageSquare,
  MapPin,
  Edit,
  CheckCircle2,
  Calendar,
  Share2,
  Settings,
  UserPlus,
  Check,
  MessageCircle,
  MoreHorizontal,
  Bookmark,
  Link as LinkIcon,
  Mic,
  Plus,
  Sparkles,
  ExternalLink,
  Flag,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePostsStore } from '@/store/posts';
import { useAuthStore } from '@/store/auth';
import type { User, Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { PostCard } from '@/components/feed/PostCard';
import { sound } from '@/lib/sound';
import { EditProfileModal } from './EditProfileModal';
import { FollowersModal } from './FollowersModal';
import { HighlightsViewerModal, type HighlightItem } from './HighlightsViewerModal';
import { ShareProfileModal } from './ShareProfileModal';
import { toast } from 'sonner';

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return (num || 0).toString();
}

const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'h1',
    title: 'Travels',
    emoji: '✈️',
    coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
    slides: [
      {
        id: 'h1-1',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80',
        caption: 'Santorini sunsets never get old 🌅',
        tag: '🇬🇷 Oia, Greece',
      },
      {
        id: 'h1-2',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&q=80',
        caption: 'Late night walk through Shinjuku rain 🌧️',
        tag: '🇯🇵 Tokyo, Japan',
      },
    ],
  },
  {
    id: 'h2',
    title: 'Music',
    emoji: '🎸',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    slides: [
      {
        id: 'h2-1',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&q=80',
        caption: 'Acoustic sessions in the stairwell with natural reverb 🎵',
        tag: 'Studio Vibing',
      },
    ],
  },
  {
    id: 'h3',
    title: 'Cafe Finds',
    emoji: '☕',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    slides: [
      {
        id: 'h3-1',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&q=80',
        caption: 'Quiet bookshop cafe where coffee comes with Turkish delights',
        tag: '☕ Cozy Corners',
      },
    ],
  },
  {
    id: 'h4',
    title: 'Art Studio',
    emoji: '🎨',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    slides: [
      {
        id: 'h4-1',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1080&q=80',
        caption: 'Character development and rough ink studies',
        tag: '🎨 Studio Berlin',
      },
    ],
  },
];

interface ProfileViewProps {
  userId?: string;
}

export function ProfileView({ userId = 'me' }: ProfileViewProps) {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const posts = usePostsStore((state) => state.posts);

  const isOwnProfile = userId === 'me' || userId === authUser?.id;
  const initialUser: User | null = isOwnProfile ? (authUser || null) : null;

  // If not own profile and no auth user, we need to fetch the profile via API
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isOwnProfile && userId && userId !== 'me') {
      const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const res = await fetch(`/api/users/${userId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              setFetchedUser(data.user);
            }
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [userId, isOwnProfile]);

  const resolvedUser: User = initialUser || fetchedUser || {
    id: '',
    username: '',
    displayName: 'Unknown User',
    bio: '',
    avatar: '❓',
    interests: [],
    followers: 0,
    following: 0,
    postsCount: 0,
    isConnected: false,
    isOnline: false,
    createdAt: new Date().toISOString(),
  };

  // States
  const [activeTab, setActiveTab] = useState<'posts' | 'grid' | 'audio' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(resolvedUser.isConnected || false);
  const [followersCount, setFollowersCount] = useState(resolvedUser.followers || 0);

  useEffect(() => {
    setIsFollowing(resolvedUser.isConnected || false);
    setFollowersCount(resolvedUser.followers || 0);
  }, [resolvedUser.isConnected, resolvedUser.followers]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [followersModalInitialTab, setFollowersModalInitialTab] = useState<'followers' | 'following'>('followers');
  const [activeHighlight, setActiveHighlight] = useState<HighlightItem | null>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Filter posts for this user
  const userPosts = posts.filter(
    (p) =>
      p.author.id === resolvedUser.id ||
      (isOwnProfile && (p.author.id === 'me' || p.author.username === resolvedUser.username))
  );

  const userMediaPosts = userPosts.filter((p) => !!p.image);
  const userAudioPosts = userPosts.filter((p) => p.format === 'voice');
  const userSavedPosts = posts.filter((p) => p.isSaved || p.isLiked);

  const handleToggleFollow = async () => {
    if (!resolvedUser.id) return;
    const next = !isFollowing;
    // Optimistic update
    setIsFollowing(next);
    setFollowersCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    if (next) {
      sound.playHeart();
    } else {
      sound.playPop(320);
    }
    try {
      if (next) {
        const res = await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ targetUserId: resolvedUser.id }),
        });
        if (!res.ok) throw new Error('Failed to follow');
        toast.success(`You are now following @${resolvedUser.username}! ✨`);
      } else {
        const res = await fetch(`/api/connections/${resolvedUser.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to unfollow');
        toast.info(`Unfollowed @${resolvedUser.username}`);
      }
    } catch {
      // Rollback on failure
      setIsFollowing(!next);
      setFollowersCount((prev) => (!next ? prev + 1 : Math.max(0, prev - 1)));
      toast.error(next ? 'Failed to follow user' : 'Failed to unfollow user');
    }
  };

  const handleShareProfile = () => {
    sound.playPop(480);
    setIsShareModalOpen(true);
  };

  const handleOpenFollowers = (tab: 'followers' | 'following') => {
    sound.playPop(420);
    setFollowersModalInitialTab(tab);
    setIsFollowersModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-24 md:pb-12">
      {/* 1. Cover Banner */}
      <div
        className={`h-40 sm:h-52 w-full bg-gradient-to-r ${
          resolvedUser.cover || 'from-indigo-600 via-purple-600 to-cyan-500'
        } relative border-b border-border/60 overflow-hidden shadow-inner`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:20px_20px] pointer-events-none" />

        {/* Top Right Banner Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleShareProfile}
            className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs h-8 px-3 border border-white/20 gap-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {isOwnProfile && (
            <Link href="/settings">
              <Button
                size="sm"
                className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs h-8 w-8 p-0 border border-white/20 shadow-sm"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-14 sm:-mt-16 relative z-10">
        {/* 2. Main Profile Card Header */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm mb-5">
          {/* Avatar and Action Buttons Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
            <div className="relative inline-block">
              {/* Avatar with Glow Ring */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl phryvos-gradient flex items-center justify-center text-4xl shadow-xl ring-4 ring-card text-white overflow-hidden">
                {resolvedUser.avatar || '😊'}
              </div>
              {resolvedUser.isOnline && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-card"
                  title="Online now"
                />
              )}
            </div>

            {/* Action Buttons: Own vs Stranger */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={() => {
                      setIsEditModalOpen(true);
                      sound.playPop(480);
                    }}
                    size="sm"
                    className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 h-8.5 px-4.5 shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </Button>

                  <Button
                    onClick={handleShareProfile}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs border-border/80 hover:bg-secondary gap-1.5 h-8.5 px-4 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleToggleFollow}
                    size="sm"
                    className={`rounded-full text-xs gap-1.5 h-8.5 px-5 transition-all shadow-xs ${
                      isFollowing
                        ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                        : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      sound.playPop(450);
                      router.push('/chat');
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs border-border/80 hover:bg-secondary gap-1.5 h-8.5 px-4 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    <span>Message</span>
                  </Button>

                  {/* More Options Dropdown */}
                  <div className="relative">
                    <Button
                      onClick={() => setShowOptionsDropdown((p) => !p)}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs border-border/80 hover:bg-secondary h-8.5 w-8.5 p-0 shadow-xs"
                      aria-label="More profile options"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <AnimatePresence>
                      {showOptionsDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          className="absolute right-0 top-10 w-44 rounded-2xl bg-card border border-border/80 shadow-xl p-1.5 z-30 space-y-1"
                        >
                          <button
                            onClick={() => {
                              handleShareProfile();
                              setShowOptionsDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary rounded-xl flex items-center gap-2"
                          >
                            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Copy Profile Link</span>
                          </button>
                          <button
                            onClick={() => {
                              toast.info(`Reported @${resolvedUser.username} to moderation`);
                              setShowOptionsDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center gap-2"
                          >
                            <Flag className="w-3.5 h-3.5 text-rose-500" />
                            <span>Report Profile</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {resolvedUser.displayName}
              </h1>
              <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10 shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">@{resolvedUser.username}</p>

            {/* Bio with line breaks */}
            <p className="text-xs sm:text-sm text-foreground/90 mt-2.5 leading-relaxed whitespace-pre-line">
              {resolvedUser.bio || 'Exploring the world one stranger conversation at a time ✨'}
            </p>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
              {resolvedUser.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{resolvedUser.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Joined {new Date(resolvedUser.createdAt || '2025-01-01').getFullYear()}</span>
              </span>
              <a
                href="https://phryvos.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <LinkIcon className="w-3 h-3" />
                <span>phryvos.in/{resolvedUser.username}</span>
              </a>
            </div>

            {/* Interest Tags */}
            {resolvedUser.interests && resolvedUser.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {resolvedUser.interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 3. Follower & Stats Bar */}
            <div className="flex items-center gap-6 border-t border-border/60 mt-4 pt-3.5">
              <div>
                <span className="font-extrabold text-sm sm:text-base text-foreground">
                  {formatNumber(userPosts.length || resolvedUser.postsCount || 0)}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5">Posts</span>
              </div>

              <button
                onClick={() => handleOpenFollowers('followers')}
                className="hover:opacity-80 transition-opacity text-left"
              >
                <span className="font-extrabold text-sm sm:text-base text-foreground">
                  {formatNumber(followersCount)}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5 hover:underline">Followers</span>
              </button>

              <button
                onClick={() => handleOpenFollowers('following')}
                className="hover:opacity-80 transition-opacity text-left"
              >
                <span className="font-extrabold text-sm sm:text-base text-foreground">
                  {formatNumber(resolvedUser.following || 0)}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5 hover:underline">Following</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Story Highlights Carousel (Instagram-style) */}
        <div className="mb-5 px-1">
          <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
            {/* New Highlight Button for Own Profile */}
            {isOwnProfile && (
              <button
                onClick={() => toast.info('Create Highlight feature: Select stories from your archive!')}
                className="flex flex-col items-center gap-1.5 w-16 shrink-0 group focus:outline-none"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-border/80 group-hover:border-primary flex items-center justify-center bg-card transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-16 text-center">New</span>
              </button>
            )}

            {/* Preset Highlights */}
            {DEFAULT_HIGHLIGHTS.map((hl) => (
              <button
                key={hl.id}
                onClick={() => {
                  sound.playPop(520);
                  setActiveHighlight(hl);
                }}
                className="flex flex-col items-center gap-1.5 w-16 shrink-0 group focus:outline-none"
              >
                <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <div className="w-full h-full rounded-full bg-background overflow-hidden p-0.5 flex items-center justify-center">
                    <img src={hl.coverImage} alt={hl.title} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs bg-card rounded-full p-0.5 shadow-xs border border-border/60">
                    {hl.emoji}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-16 text-center group-hover:text-foreground transition-colors">
                  {hl.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Content Tabs Navigation */}
        <div className="flex items-center justify-around border-b border-border/60 mb-4 bg-card/60 backdrop-blur-md rounded-2xl p-1 shadow-xs">
          <button
            onClick={() => {
              setActiveTab('posts');
              sound.playPop(420);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'posts' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Posts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('grid');
              sound.playPop(460);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'grid' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Photos ({userMediaPosts.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audio');
              sound.playPop(500);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'audio' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Drops</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('saved');
              sound.playPop(540);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'saved' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isOwnProfile ? 'Saved' : 'Liked'}</span>
          </button>
        </div>

        {/* 6. Tab Content Panels */}
        {/* Tab 1: Posts Stream */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {userPosts.length === 0 && (
              <div className="text-center py-12 px-4 bg-card/60 border border-border/70 rounded-3xl">
                <p className="text-sm font-semibold text-foreground mb-1">No posts yet</p>
                <p className="text-xs text-muted-foreground">Stories shared by this user will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Photos Grid (Instagram-style 3-column) */}
        {activeTab === 'grid' && (
          <div className="grid grid-cols-3 gap-2">
            {userMediaPosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50 border border-border/70 group cursor-pointer"
              >
                <img
                  src={post.image}
                  alt="Media"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>{post.likes}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>{post.comments}</span>
                  </span>
                </div>
              </div>
            ))}

            {userMediaPosts.length === 0 && (
              <div className="col-span-3 text-center py-12 px-4 bg-card/60 border border-border/70 rounded-3xl">
                <p className="text-sm font-semibold text-foreground mb-1">No media photos yet</p>
                <p className="text-xs text-muted-foreground">Photos shared will be showcased in this gallery.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Voice Drops */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            {userAudioPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {userAudioPosts.length === 0 && (
              <div className="text-center py-12 px-4 bg-card/60 border border-border/70 rounded-3xl">
                <Mic className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground mb-1">No voice drops yet</p>
                <p className="text-xs text-muted-foreground">Audio snippets and ambient notes will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Saved / Liked */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {userSavedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {userSavedPosts.length === 0 && (
              <div className="text-center py-12 px-4 bg-card/60 border border-border/70 rounded-3xl">
                <Bookmark className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground mb-1">No saved stories</p>
                <p className="text-xs text-muted-foreground">Bookmark stories in your feed to view them here.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        initialTab={followersModalInitialTab}
        userName={resolvedUser.username}
        profileUserId={resolvedUser.id}
      />
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={resolvedUser}
      />
      <HighlightsViewerModal highlight={activeHighlight} onClose={() => setActiveHighlight(null)} />
    </div>
  );
}
