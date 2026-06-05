/** 主进程和渲染进程共享的类型定义 */

/** 视频信息 */
export interface VideoInfo {
  aid: number;
  bvid: string;
  title: string;
  created: number;       // 发布时间戳
  is_only_self: number;  // 0=公开, 1=仅自己可见
  state: number;
  cover: string;          // 封面 URL
}

/** 用户信息 */
export interface UserInfo {
  uid: string;
  name: string;
  face: string;
}

/** 定时任务参数 */
export interface CreateTaskParams {
  videoIds: string[];
  videoTitles: string[];
  setPrivate: boolean;
  timeStr: string;  // HH:MM:SS
}

/** 更新任务参数 */
export interface UpdateTaskParams {
  videoIds?: string[];
  videoTitles?: string[];
  setPrivate?: boolean;
  timeStr?: string;
}

/** 定时任务信息 */
export interface TaskInfo {
  taskId: string;
  videoIds: string[];
  videoTitles: string[];
  setPrivate: boolean;
  timeStr: string;
  createdAt: string;
}

/** 日志条目 */
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

/** API 统一返回格式 */
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 调度器状态 */
export interface SchedulerStatus {
  running: boolean;
  taskCount: number;
  nextRunTimes: { taskId: string; time: string }[];
}

/** 应用设置 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoStart: boolean;
  minimizeToTray: boolean;
}

/** 仪表盘统计 */
export interface DashboardStats {
  totalVideos: number;
  privateVideos: number;
  publicVideos: number;
  activeTasks: number;
}
