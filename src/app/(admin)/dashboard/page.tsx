'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Shield,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Ban,
  Trash2,
  Eye,
  UserX,
  UserCheck,
  Database,
  FileText,
  Bell,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Admin ID - will be configured via environment variable in production
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_ID;

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  reports: number;
  bannedUsers: number;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
  postsCount: number;
}

interface Post {
  id: string;
  content: string;
  format: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if current user matches admin ID
      const sessionResponse = await fetch('/api/auth/me');
      const sessionData = await sessionResponse.json();

      if (sessionData.success && sessionData.user) {
        const isAdminUser = sessionData.user.id === ADMIN_USER_ID;
        setIsAdmin(isAdminUser);

        if (isAdminUser) {
          loadDashboardData();
        }
      }
    } catch (error) {
      console.error('Failed to check admin access:', error);
    } finally {
      setCheckLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users?limit=50');
      const usersData = await usersResponse.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }

      // Load posts
      const postsResponse = await fetch('/api/admin/posts?limit=20');
      const postsData = await postsResponse.json();
      if (postsData.success) {
        setPosts(postsData.posts);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: ban }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isBanned: ban } : u
          )
        );
        setStats((prev) =>
          prev
            ? {
                ...prev,
                bannedUsers: ban ? prev.bannedUsers + 1 : prev.bannedUsers - 1,
                activeUsers: ban ? prev.activeUsers - 1 : prev.activeUsers + 1,
              }
            : prev
        );
      }
    } catch (error) {
      console.error('Failed to ban/unban user:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setStats((prev) =>
          prev ? { ...prev, totalPosts: prev.totalPosts - 1 } : prev
        );
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Button onClick={() => (window.location.href = '/feed')} variant="outline">
            Return to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">System Control Panel</p>
            </div>
          </div>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Grid */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats.totalUsers}
              color="blue"
            />
            <StatCard
              icon={Zap}
              label="Active Users"
              value={stats.activeUsers}
              color="green"
            />
            <StatCard
              icon={MessageSquare}
              label="Total Posts"
              value={stats.totalPosts}
              color="purple"
            />
            <StatCard
              icon={AlertCircle}
              label="Reports"
              value={stats.reports}
              color="orange"
            />
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'posts', label: 'Posts', icon: MessageSquare },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab posts={posts} users={users} />
            )}
            {activeTab === 'users' && (
              <UsersTab
                users={filteredUsers}
                onBan={handleBanUser}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
              />
            )}
            {activeTab === 'posts' && (
              <PostsTab posts={posts} onDelete={handleDeletePost} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ posts, users }: { posts: Post[]; users: User[] }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Recent Users</h3>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                    {user.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <Badge variant={user.isBanned ? 'destructive' : 'secondary'} size="sm">
                  {user.isBanned ? 'Banned' : 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Recent Posts</h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by @{post.author.username}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 text-xs text-muted-foreground">
                  <span>{post.likesCount} likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({
  users,
  onBan,
  searchQuery,
  onSearch,
}: {
  users: User[];
  onBan: (id: string, ban: boolean) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Posts</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{user.postsCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isBanned ? 'destructive' : 'secondary'} size="sm">
                      {user.isBanned ? 'Banned' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onBan(user.id, !user.isBanned)}
                      >
                        {user.isBanned ? (
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Ban className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}

function PostsTab({
  posts,
  onDelete,
}: {
  posts: Post[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {post.author.displayName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">@{post.author.username}</span>
                    <span className="text-xs text-muted-foreground">{post.format}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{post.likesCount} likes</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {posts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No posts found
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">System Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Temporarily disable user access</p>
            </div>
            <button className="w-11 h-6 bg-secondary rounded-full relative transition-colors">
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Registration</p>
              <p className="text-xs text-muted-foreground">Allow new user registrations</p>
            </div>
            <button className="w-11 h-6 bg-primary rounded-full relative">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-moderation</p>
              <p className="text-xs text-muted-foreground">AI-powered content filtering</p>
            </div>
            <button className="w-11 h-6 bg-secondary rounded-full relative transition-colors">
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
