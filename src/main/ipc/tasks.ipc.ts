/**
 * 任务相关 IPC 处理器
 */
import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { CredentialService } from '../services/credential.service';
import { SchedulerService } from '../services/scheduler.service';
import { useApi } from './auth.ipc';
import { ApiResult, TaskInfo, CreateTaskParams, UpdateTaskParams } from '../../shared/types';

/** 生成唯一任务 ID */
function generateTaskId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `task_${timestamp}_${suffix}`;
}

export function registerTasksIPC(scheduler: SchedulerService): void {
  // 创建任务
  ipcMain.handle(IPC.TASK_CREATE, async (_event, params: CreateTaskParams): Promise<ApiResult<TaskInfo>> => {
    try {
      const api = useApi();
      scheduler.setBiliApi(api);

      const taskId = generateTaskId();
      const taskInfo: TaskInfo = {
        taskId,
        videoIds: params.videoIds,
        videoTitles: params.videoTitles,
        setPrivate: params.setPrivate,
        timeStr: params.timeStr,
        createdAt: new Date().toISOString(),
      };

      scheduler.addTask(taskInfo);

      // 持久化
      const allTasks = CredentialService.loadTasks();
      allTasks[taskId] = {
        videoIds: params.videoIds,
        videoTitles: params.videoTitles,
        setPrivate: params.setPrivate,
        timeStr: params.timeStr,
      };
      CredentialService.saveTasks(allTasks);

      return { success: true, data: taskInfo };
    } catch (error: any) {
      return { success: false, error: error.message || '创建任务失败' };
    }
  });

  // 更新任务
  ipcMain.handle(IPC.TASK_UPDATE, async (_event, taskId: string, params: UpdateTaskParams): Promise<ApiResult<TaskInfo>> => {
    try {
      const allTasks = CredentialService.loadTasks();
      if (!allTasks[taskId]) {
        return { success: false, error: '任务不存在' };
      }

      // 更新持久化数据
      if (params.videoIds !== undefined) allTasks[taskId].videoIds = params.videoIds;
      if (params.videoTitles !== undefined) allTasks[taskId].videoTitles = params.videoTitles;
      if (params.setPrivate !== undefined) allTasks[taskId].setPrivate = params.setPrivate;
      if (params.timeStr !== undefined) allTasks[taskId].timeStr = params.timeStr;
      CredentialService.saveTasks(allTasks);

      // 重建调度器中的任务
      scheduler.removeTask(taskId);
      const updatedTask: TaskInfo = {
        taskId,
        videoIds: allTasks[taskId].videoIds,
        videoTitles: allTasks[taskId].videoTitles,
        setPrivate: allTasks[taskId].setPrivate,
        timeStr: allTasks[taskId].timeStr,
        createdAt: allTasks[taskId].createdAt || new Date().toISOString(),
      };
      scheduler.addTask(updatedTask);

      return { success: true, data: updatedTask };
    } catch (error: any) {
      return { success: false, error: error.message || '更新任务失败' };
    }
  });

  // 删除任务
  ipcMain.handle(IPC.TASK_DELETE, async (_event, taskId: string): Promise<ApiResult<void>> => {
    try {
      scheduler.removeTask(taskId);
      const allTasks = CredentialService.loadTasks();
      delete allTasks[taskId];
      CredentialService.saveTasks(allTasks);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || '删除任务失败' };
    }
  });

  // 获取任务列表
  ipcMain.handle(IPC.TASK_LIST, async (): Promise<ApiResult<TaskInfo[]>> => {
    try {
      const tasks = scheduler.getAllTasks();
      return { success: true, data: tasks };
    } catch (error: any) {
      return { success: false, error: error.message || '获取任务列表失败' };
    }
  });

  // 立即执行任务
  ipcMain.handle(IPC.TASK_EXECUTE_NOW, async (_event, taskId: string): Promise<ApiResult<void>> => {
    try {
      const api = useApi();
      scheduler.setBiliApi(api);
      await scheduler.executeNow(taskId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || '执行任务失败' };
    }
  });
}
