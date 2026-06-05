/** IPC 频道名称枚举 - 主进程和渲染进程共享 */
export const IPC = {
  // 认证
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHECK: 'auth:check',

  // 视频
  VIDEO_LIST: 'video:list',
  VIDEO_SET_PRIVACY: 'video:set-privacy',

  // 任务
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_LIST: 'task:list',
  TASK_EXECUTE_NOW: 'task:execute-now',

  // 调度器
  SCHEDULER_START: 'scheduler:start',
  SCHEDULER_STOP: 'scheduler:stop',
  SCHEDULER_STATUS: 'scheduler:status',

  // 日志（主进程 → 渲染进程推送）
  LOG_APPEND: 'log:append',

  // 主题
  THEME_GET: 'theme:get',
  THEME_SET: 'theme:set',

  // 应用设置
  APP_GET_SETTINGS: 'app:get-settings',
  APP_SET_SETTINGS: 'app:set-settings',
} as const;
