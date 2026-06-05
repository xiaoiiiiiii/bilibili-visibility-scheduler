/**
 * Electron 预加载脚本
 * 使用 contextBridge 安全地暴露 IPC API 给渲染进程
 */
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type {
  ApiResult,
  VideoInfo,
  UserInfo,
  TaskInfo,
  CreateTaskParams,
  UpdateTaskParams,
  SchedulerStatus,
  AppSettings,
  LogEntry,
} from '../shared/types';

/** 暴露给渲染进程的类型安全 API */
const electronAPI = {
  // ==================== 认证 ====================
  login: (sessdata: string, biliJct: string, dedeUserId: string): Promise<ApiResult<UserInfo>> =>
    ipcRenderer.invoke(IPC.AUTH_LOGIN, sessdata, biliJct, dedeUserId),

  logout: (): Promise<void> =>
    ipcRenderer.invoke(IPC.AUTH_LOGOUT),

  checkLogin: (): Promise<ApiResult<UserInfo | null>> =>
    ipcRenderer.invoke(IPC.AUTH_CHECK),

  // ==================== 视频 ====================
  getVideoList: (): Promise<ApiResult<VideoInfo[]>> =>
    ipcRenderer.invoke(IPC.VIDEO_LIST),

  setPrivacy: (bvid: string, title: string, isPrivate: boolean): Promise<ApiResult<boolean>> =>
    ipcRenderer.invoke(IPC.VIDEO_SET_PRIVACY, bvid, title, isPrivate),

  // ==================== 任务 ====================
  createTask: (params: CreateTaskParams): Promise<ApiResult<TaskInfo>> =>
    ipcRenderer.invoke(IPC.TASK_CREATE, params),

  updateTask: (taskId: string, params: UpdateTaskParams): Promise<ApiResult<TaskInfo>> =>
    ipcRenderer.invoke(IPC.TASK_UPDATE, taskId, params),

  deleteTask: (taskId: string): Promise<ApiResult<void>> =>
    ipcRenderer.invoke(IPC.TASK_DELETE, taskId),

  listTasks: (): Promise<ApiResult<TaskInfo[]>> =>
    ipcRenderer.invoke(IPC.TASK_LIST),

  executeNow: (taskId: string): Promise<ApiResult<void>> =>
    ipcRenderer.invoke(IPC.TASK_EXECUTE_NOW, taskId),

  // ==================== 调度器 ====================
  startScheduler: (): Promise<ApiResult<void>> =>
    ipcRenderer.invoke(IPC.SCHEDULER_START),

  stopScheduler: (): Promise<ApiResult<void>> =>
    ipcRenderer.invoke(IPC.SCHEDULER_STOP),

  getSchedulerStatus: (): Promise<ApiResult<SchedulerStatus>> =>
    ipcRenderer.invoke(IPC.SCHEDULER_STATUS),

  // ==================== 主题 ====================
  getTheme: (): Promise<string> =>
    ipcRenderer.invoke(IPC.THEME_GET),

  setTheme: (theme: string): Promise<void> =>
    ipcRenderer.invoke(IPC.THEME_SET, theme),

  // ==================== 应用设置 ====================
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.APP_GET_SETTINGS),

  setSettings: (settings: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC.APP_SET_SETTINGS, settings),

  // ==================== 日志监听（主进程推送） ====================
  onLogAppend: (callback: (log: LogEntry) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: LogEntry) => callback(log);
    ipcRenderer.on(IPC.LOG_APPEND, handler);
    // 返回取消订阅函数
    return () => {
      ipcRenderer.removeListener(IPC.LOG_APPEND, handler);
    };
  },

  // 主题变更监听
  onThemeChange: (callback: (theme: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: string) => callback(theme);
    ipcRenderer.on(IPC.THEME_SET, handler);
    return () => {
      ipcRenderer.removeListener(IPC.THEME_SET, handler);
    };
  },
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('[Preload] electronAPI 已成功暴露到渲染进程');
} catch (error) {
  console.error('[Preload] 暴露 electronAPI 失败:', error);
}
