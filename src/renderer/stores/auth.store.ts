/** 认证状态管理 */
import { create } from 'zustand';
import type { UserInfo } from '../../shared/types';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  error: string | null;

  login: (sessdata: string, biliJct: string, dedeUserId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkLogin: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isLoading: false,
  user: null,
  error: null,

  login: async (sessdata, biliJct, dedeUserId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.login(sessdata, biliJct, dedeUserId);
      if (result.success && result.data) {
        set({ isLoggedIn: true, user: result.data, isLoading: false });
        return true;
      } else {
        set({ error: result.error || '登录失败', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message || '登录异常', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await window.electronAPI.logout();
    set({ isLoggedIn: false, user: null, error: null });
  },

  checkLogin: async () => {
    set({ isLoading: true });
    try {
      const result = await window.electronAPI.checkLogin();
      if (result.success && result.data) {
        set({ isLoggedIn: true, user: result.data, isLoading: false });
      } else {
        set({ isLoggedIn: false, user: null, isLoading: false });
      }
    } catch {
      set({ isLoggedIn: false, user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
