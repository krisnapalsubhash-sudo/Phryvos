import { create } from 'zustand';

type View = 'feed' | 'discover' | 'random' | 'messages' | 'notifications' | 'profile' | 'settings';

interface UIState {
  sidebarOpen: boolean;
  activeView: View;
  selectedChatId: string | null;
  isDark: boolean;
  toggleSidebar: () => void;
  setActiveView: (view: View) => void;
  setSelectedChat: (id: string | null) => void;
  setTheme: (isDark: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeView: 'feed',
  selectedChatId: null,
  isDark: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),
  setSelectedChat: (id) => set({ selectedChatId: id }),

  setTheme: (isDark) => set({ isDark }),
  toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
}));
