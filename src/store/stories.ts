import { create } from 'zustand';
import { MOCK_STORIES } from '@/lib/mock/posts';
import type { Story } from '@/types';

interface StoriesState {
  stories: Story[];
  activeStoryId: string | null;
  loading: boolean;
  error: string | null;

  // Local mutations
  reset: () => void;
  addStory: (story: Story) => void;
  markSeen: (storyId: string) => void;
  openStory: (storyId: string) => void;
  closeStory: () => void;

  // API-backed actions
  fetchStories: (userId?: string) => Promise<void>;
  addStoryAPI: (images: string[], expiresAt?: Date) => Promise<Story | null>;
  viewStoryAPI: (storyId: string) => Promise<void>;
  deleteStoryAPI: (storyId: string) => Promise<void>;
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

export const useStoriesStore = create<StoriesState>((set, get) => ({
  stories: MOCK_STORIES,
  activeStoryId: null,
  loading: false,
  error: null,

  // Local mutations
  reset: () =>
    set({
      stories: MOCK_STORIES,
      activeStoryId: null,
      loading: false,
      error: null,
    }),

  addStory: (newStory: Story) =>
    set((state) => ({
      stories: [newStory, ...state.stories],
    })),

  markSeen: (storyId: string) =>
    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === storyId ? { ...s, hasSeen: true } : s
      ),
    })),

  openStory: (storyId: string) =>
    set({
      activeStoryId: storyId,
    }),

  closeStory: () =>
    set({
      activeStoryId: null,
    }),

  // API-backed actions
  fetchStories: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = `/api/stories${userId ? `?userId=${userId}` : ''}`;
      const data = await apiFetch<{ success: boolean; stories: Story[] }>(url);

      if (data.success && data.stories) {
        set({ stories: data.stories, loading: false });
      } else {
        set({ loading: false, error: 'Failed to fetch stories' });
      }
    } catch (error) {
      console.error('fetchStories error:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to fetch stories' });
    }
  },

  addStoryAPI: async (images: string[], expiresAt?: Date) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ success: boolean; story: Story }>('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ images, expiresAt: expiresAt?.toISOString() }),
      });

      if (data.success && data.story) {
        set({ loading: false });
        return data.story;
      }
      set({ loading: false, error: 'Failed to create story' });
      return null;
    } catch (error) {
      console.error('addStoryAPI error:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to create story' });
      return null;
    }
  },

  viewStoryAPI: async (storyId: string) => {
    try {
      const data = await apiFetch<{ success: boolean; views: number }>(`/api/stories/${storyId}/view`, {
        method: 'POST',
      });

      if (data.success) {
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === storyId ? { ...s, views: data.views, hasSeen: true } : s
          ),
        }));
      }
    } catch (error) {
      console.error('viewStoryAPI error:', error);
    }
  },

  deleteStoryAPI: async (storyId: string) => {
    try {
      const data = await apiFetch<{ success: boolean }>(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (data.success) {
        set((state) => ({
          stories: state.stories.filter((s) => s.id !== storyId),
        }));
      }
    } catch (error) {
      console.error('deleteStoryAPI error:', error);
    }
  },
}));
