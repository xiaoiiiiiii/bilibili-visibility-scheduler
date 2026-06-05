/**
 * 视频相关 IPC 处理器
 */
import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { useApi } from './auth.ipc';
import { ApiResult, VideoInfo, LogEntry } from '../../shared/types';

/** 推送日志到渲染进程 */
function pushLog(mainWindow: BrowserWindow | null, level: LogEntry['level'], message: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  // 控制台也输出一份
  const emoji = level === 'SUCCESS' ? '✅' : level === 'ERROR' ? '❌' : '📋';
  console.log(`${emoji} [${level}] ${message}`);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC.LOG_APPEND, entry);
  }
}

export function registerVideosIPC(mainWindow: BrowserWindow | null): void {
  // 获取视频列表
  ipcMain.handle(IPC.VIDEO_LIST, async (): Promise<ApiResult<VideoInfo[]>> => {
    try {
      const api = useApi();
      const videos = await api.getAllVideos();
      pushLog(mainWindow, 'INFO', `已加载 ${videos.length} 个视频`);
      return { success: true, data: videos };
    } catch (error: any) {
      pushLog(mainWindow, 'ERROR', `获取视频列表失败: ${error.message}`);
      return { success: false, error: error.message || '获取视频列表失败' };
    }
  });

  // 设置视频可见性
  ipcMain.handle(IPC.VIDEO_SET_PRIVACY, async (_event, bvid: string, title: string, isPrivate: boolean): Promise<ApiResult<boolean>> => {
    try {
      const api = useApi();
      const result = await api.setPrivacy(bvid, isPrivate);
      const action = isPrivate ? '设为私有' : '设为公开';
      if (result) {
        pushLog(mainWindow, 'SUCCESS', `视频 ${bvid} (${title}) ${action} 成功`);
      } else {
        pushLog(mainWindow, 'ERROR', `视频 ${bvid} (${title}) ${action} 失败`);
      }
      return { success: true, data: result };
    } catch (error: any) {
      pushLog(mainWindow, 'ERROR', `视频 ${bvid} 操作异常: ${error.message}`);
      return { success: false, error: error.message || '设置可见性失败' };
    }
  });
}
