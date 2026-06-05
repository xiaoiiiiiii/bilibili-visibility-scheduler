/** 任务状态管理 */
import { create } from 'zustand';
import type { TaskInfo, CreateTaskParams, UpdateTaskParams } from '../../shared/types';

interface TasksState {
  tasks: TaskInfo[];
  isLoading: boolean;
  error: string | null;
  schedulerRunning: boolean;

  fetchTasks: () => Promise<void>;
  createTask: (params: CreateTaskParams) => Promise<boolean>;
  updateTask: (taskId: string, params: UpdateTaskParams) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  executeNow: (taskId: string) => Promise<boolean>;
  startScheduler: () => Promise<void>;
  stopScheduler: () => Promise<void>;
  checkSchedulerStatus: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,
  schedulerRunning: false,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.listTasks();
      if (result.success && result.data) {
        set({ tasks: result.data, isLoading: false });
      } else {
        set({ error: result.error || '获取任务失败', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || '获取任务异常', isLoading: false });
    }
  },

  createTask: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.createTask(params);
      if (result.success && result.data) {
        set((state) => ({ tasks: [...state.tasks, result.data!], isLoading: false }));
        return true;
      } else {
        set({ error: result.error || '创建任务失败', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message || '创建任务异常', isLoading: false });
      return false;
    }
  },

  updateTask: async (taskId, params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.updateTask(taskId, params);
      if (result.success && result.data) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.taskId === taskId ? result.data! : t)),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error || '更新任务失败', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message || '更新任务异常', isLoading: false });
      return false;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const result = await window.electronAPI.deleteTask(taskId);
      if (result.success) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.taskId !== taskId),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  executeNow: async (taskId) => {
    try {
      const result = await window.electronAPI.executeNow(taskId);
      return result.success;
    } catch {
      return false;
    }
  },

  startScheduler: async () => {
    try {
      const result = await window.electronAPI.startScheduler();
      if (result.success) set({ schedulerRunning: true });
    } catch { /* ignore */ }
  },

  stopScheduler: async () => {
    try {
      const result = await window.electronAPI.stopScheduler();
      if (result.success) set({ schedulerRunning: false });
    } catch { /* ignore */ }
  },

  checkSchedulerStatus: async () => {
    try {
      const result = await window.electronAPI.getSchedulerStatus();
      if (result.success && result.data) {
        set({ schedulerRunning: result.data.running });
      }
    } catch { /* ignore */ }
  },
}));
