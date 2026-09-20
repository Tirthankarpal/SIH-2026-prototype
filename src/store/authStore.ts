import { create } from 'zustand';
import { api, supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  initialize: () => void;
  logout: () => Promise<void>;
  setUser: (user: { id: string; email?: string } | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // true until we verify session

  setUser: (user) => set({ user }),

  initialize: async () => {
    if (isSupabaseConfigured && supabase) {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, isLoading: false });

      // 2. Listen for auth changes (login/logout from other tabs)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
      });
    } else {
      // Mock mode
      const mockUser = localStorage.getItem('swasthyalipi_mock_user');
      set({ user: mockUser ? JSON.parse(mockUser) : null, isLoading: false });
      
      // Listen for cross-tab mock login
      window.addEventListener('storage', (e) => {
        if (e.key === 'swasthyalipi_mock_user') {
          const val = localStorage.getItem('swasthyalipi_mock_user');
          set({ user: val ? JSON.parse(val) : null });
        }
      });
    }
  },

  logout: async () => {
    await api.signOut();
    set({ user: null });
  }
}));
