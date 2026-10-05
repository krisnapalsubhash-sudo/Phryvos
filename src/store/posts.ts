import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Post } from '@/types';
import { getSessionEpoch, isStaleRequest } from '@/lib/auth/session-epoch';

const createServerSafeStorage = (): any => ({
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
});

interface PostsState {
  ownerUserId: string | null;
  posts: Post[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Local mutations (optimistic)
  setOwnerUserId: (userId: string | null) => void;
  reset: () => void;
  toggleLike: (postId: string) => void;
  addPost: (post: Post) => void;
  deletePost: (postId: string) => void;
  setPosts: (posts: Post[]) => void;

  // API-backed actions
  fetchFeed: (cursor?: string) => Promise<void>;
  createPost: (postData: Omit<Post, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'shares' | 'isLiked' | 'isSaved'>) => Promise<Post | null>;
  toggleLikeAPI: (postId: string) => Promise<void>;
  deletePostAPI: (postId: string) => Promise<void>;
}

const API_BASE = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const usePostsStore = create<PostsState>()(
  persist(
    (set, get) => ({
      ownerUserId: null,
      posts: [],
      loading: false,
      error: null,
      initialized: false,

      setOwnerUserId: (userId) => set({ ownerUserId: userId }),

      reset: () =>
        set({
          ownerUserId: null,
          posts: [],
          loading: false,
          error: null,
          initialized: false,
        }),

      // Local optimistic updates
      toggleLike: (postId: string) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                }
              : post
          ),
        })),

      addPost: (post: Post) =>
        set((state) => ({
          posts: [post, ...state.posts],
        })),

      deletePost: (postId: string) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        })),

      setPosts: (posts: Post[]) => set({ posts, initialized: true }),

      // API-backed actions
      fetchFeed: async (cursor?: string) => {
        const epoch = getSessionEpoch();
        set({ loading: true, error: null });
        try {
          const url = `/api/posts${cursor ? `?cursor=${cursor}` : ''}`;
          const data = await apiFetch<{ success: boolean; posts: Post[]; nextCursor?: string }>(url);

          if (isStaleRequest(epoch)) return;

          if (data.success && data.posts) {
            set((state) => ({
              posts: cursor ? [...state.posts, ...data.posts] : data.posts,
              loading: false,
              initialized: true,
            }));
          } else {
            set({ loading: false, error: 'Failed to fetch feed' });
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('fetchFeed error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to fetch feed' });
        }
      },

      createPost: async (postData) => {
        const epoch = getSessionEpoch();
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ success: boolean; post: Post }>('/api/posts', {
            method: 'POST',
            body: JSON.stringify(postData),
          });

          if (isStaleRequest(epoch)) return null;

          if (data.success && data.post) {
            // Optimistic add is already done by component, but we can sync here
            set({ loading: false });
            return data.post;
          }
          set({ loading: false, error: 'Failed to create post' });
          return null;
        } catch (error) {
          if (isStaleRequest(epoch)) return null;
          console.error('createPost error:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Failed to create post' });
          return null;
        }
      },

      toggleLikeAPI: async (postId: string) => {
        const epoch = getSessionEpoch();
        try {
          const data = await apiFetch<{ success: boolean; liked: boolean; likesCount: number }>(`/api/posts/${postId}/like`, {
            method: 'POST',
          });

          if (isStaleRequest(epoch)) return;

          if (data.success) {
            // Update local state to match server
            set((state) => ({
              posts: state.posts.map((post) =>
                post.id === postId
                  ? { ...post, isLiked: data.liked, likes: data.likesCount }
                  : post
              ),
            }));
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('toggleLikeAPI error:', error);
          // Revert optimistic update on error
          get().toggleLike(postId);
        }
      },

      deletePostAPI: async (postId: string) => {
        const epoch = getSessionEpoch();
        try {
          const data = await apiFetch<{ success: boolean }>(`/api/posts/${postId}`, {
            method: 'DELETE',
          });

          if (isStaleRequest(epoch)) return;

          if (data.success) {
            // Local delete already done optimistically
          }
        } catch (error) {
          if (isStaleRequest(epoch)) return;
          console.error('deletePostAPI error:', error);
          // Could restore post on error
        }
      },
    }),
    {
      name: 'phryvos-posts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,
        posts: state.posts,
      }),
    }
  )
);
