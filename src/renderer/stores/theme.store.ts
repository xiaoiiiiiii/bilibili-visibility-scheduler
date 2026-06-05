/** 主题状态管理 */
import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  init: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',

  setMode: (mode: ThemeMode) => {
    set({ mode });
    // 同步到主进程
    window.electronAPI?.setTheme(mode);
  },

  toggleTheme: () => {
    const newMode = get().mode === 'light' ? 'dark' : 'light';
    get().setMode(newMode);
  },

  init: async () => {
    try {
      const theme = await window.electronAPI?.getTheme();
      if (theme === 'dark' || theme === 'light') {
        set({ mode: theme });
      }
    } catch {
      // 使用默认值
    }
  },
}));
