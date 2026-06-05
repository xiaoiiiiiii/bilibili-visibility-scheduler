/**
 * 调度器控制 IPC 处理器
 */
import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { SchedulerService } from '../services/scheduler.service';
import { useApi } from './auth.ipc';
import { ApiResult, SchedulerStatus } from '../../shared/types';

export function registerSchedulerIPC(scheduler: SchedulerService): void {
  // 启动调度器
  ipcMain.handle(IPC.SCHEDULER_START, async (): Promise<ApiResult<void>> => {
    try {
      const api = useApi();
      scheduler.setBiliApi(api);
      scheduler.start();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 停止调度器
  ipcMain.handle(IPC.SCHEDULER_STOP, async (): Promise<ApiResult<void>> => {
    try {
      scheduler.stop();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 获取调度器状态
  ipcMain.handle(IPC.SCHEDULER_STATUS, async (): Promise<ApiResult<SchedulerStatus>> => {
    try {
      const status = scheduler.getStatus();
      return { success: true, data: status };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
