/** window.electronAPI 类型声明 */
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
} from '../../shared/types';

interface ElectronAPI {
  login(sessdata: string, biliJct: string, dedeUserId: string): Promise<ApiResult<UserInfo>>;
  logout(): Promise<void>;
  checkLogin(): Promise<ApiResult<UserInfo | null>>;
  getVideoList(): Promise<ApiResult<VideoInfo[]>>;
  setPrivacy(bvid: string, title: string, isPrivate: boolean): Promise<ApiResult<boolean>>;
  createTask(params: CreateTaskParams): Promise<ApiResult<TaskInfo>>;
  updateTask(taskId: string, params: UpdateTaskParams): Promise<ApiResult<TaskInfo>>;
  deleteTask(taskId: string): Promise<ApiResult<void>>;
  listTasks(): Promise<ApiResult<TaskInfo[]>>;
  executeNow(taskId: string): Promise<ApiResult<void>>;
  startScheduler(): Promise<ApiResult<void>>;
  stopScheduler(): Promise<ApiResult<void>>;
  getSchedulerStatus(): Promise<ApiResult<SchedulerStatus>>;
  getTheme(): Promise<string>;
  setTheme(theme: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  setSettings(settings: Partial<AppSettings>): Promise<void>;
  onLogAppend(callback: (log: LogEntry) => void): () => void;
  onThemeChange(callback: (theme: string) => void): () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
