/** 日志状态管理 */
import { create } from 'zustand';
import type { LogEntry } from '../../shared/types';

interface LogsState {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
  initListener: () => () => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],

  addLog: (entry: LogEntry) => {
    set((state) => ({
      logs: [...state.logs.slice(-499), entry], // 最多保留 500 条
    }));
  },

  clearLogs: () => set({ logs: [] }),

  // 初始化日志监听，返回取消订阅函数
  initListener: () => {
    if (!window.electronAPI) return () => {};
    return window.electronAPI.onLogAppend((entry) => {
      set((state) => ({
        logs: [...state.logs.slice(-499), entry],
      }));
    });
  },
}));
