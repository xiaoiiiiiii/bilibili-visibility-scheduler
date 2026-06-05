/**
 * 定时任务调度器
 * 对标原项目 scheduler.py，基于 node-cron 实现
 */
import * as cron from 'node-cron';
import { BrowserWindow } from 'electron';
import { BiliApiService } from './bili-api.service';
import { IPC } from '../../shared/ipc-channels';
import { TaskInfo, LogEntry } from '../../shared/types';

interface ScheduledJob {
  task: TaskInfo;
  cronJob: cron.ScheduledTask;
}

export class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private running: boolean = false;
  private mainWindow: BrowserWindow | null;
  private biliApi: BiliApiService | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
  }

  /** 设置 B站 API 实例 */
  setBiliApi(api: BiliApiService): void {
    this.biliApi = api;
  }

  /** 解析 HH:MM:SS 为 cron 表达式 */
  private timeToCron(timeStr: string): string {
    const parts = timeStr.split(':').map(Number);
    const second = parts[2] || 0;
    const minute = parts[1] || 0;
    const hour = parts[0] || 0;
    // cron 格式: 秒 分 时 日 月 周
    return `${second} ${minute} ${hour} * * *`;
  }

  /** 添加定时任务 */
  addTask(task: TaskInfo): void {
    // 如果已存在同 ID 任务，先移除
    this.removeTask(task.taskId);

    const cronExpression = this.timeToCron(task.timeStr);

    if (!cron.validate(cronExpression)) {
      throw new Error(`无效的 cron 表达式: ${cronExpression}`);
    }

    const cronJob = cron.schedule(cronExpression, () => {
      this.executeTask(task);
    });

    this.jobs.set(task.taskId, { task, cronJob });
    this.pushLog({ timestamp: new Date().toISOString(), level: 'INFO', message: `任务 ${task.taskId} 已排程，执行时间: ${task.timeStr}` });
  }

  /** 移除任务 */
  removeTask(taskId: string): void {
    const job = this.jobs.get(taskId);
    if (job) {
      job.cronJob.stop();
      this.jobs.delete(taskId);
    }
  }

  /** 启动调度器 */
  start(): void {
    if (!this.running) {
      this.running = true;
      this.pushLog({ timestamp: new Date().toISOString(), level: 'INFO', message: '调度器已启动' });
    }
  }

  /** 停止调度器 */
  stop(): void {
    this.running = false;
    this.pushLog({ timestamp: new Date().toISOString(), level: 'INFO', message: '调度器已停止' });
  }

  /** 获取所有任务 */
  getAllTasks(): TaskInfo[] {
    const tasks: TaskInfo[] = [];
    this.jobs.forEach((job) => tasks.push(job.task));
    return tasks;
  }

  /** 获取调度器状态 */
  getStatus(): { running: boolean; taskCount: number; nextRunTimes: { taskId: string; time: string }[] } {
    const nextRunTimes: { taskId: string; time: string }[] = [];
    this.jobs.forEach((job, taskId) => {
      nextRunTimes.push({ taskId, time: job.task.timeStr });
    });

    return {
      running: this.running,
      taskCount: this.jobs.size,
      nextRunTimes,
    };
  }

  /** 立即执行任务 */
  async executeNow(taskId: string): Promise<void> {
    const job = this.jobs.get(taskId);
    if (!job) {
      throw new Error(`任务 ${taskId} 不存在`);
    }
    await this.executeTask(job.task);
  }

  /** 执行任务（内部方法） */
  private async executeTask(task: TaskInfo): Promise<void> {
    if (!this.biliApi) {
      this.pushLog({ timestamp: new Date().toISOString(), level: 'ERROR', message: '未登录，无法执行任务' });
      return;
    }

    const privacyText = task.setPrivate ? '私有' : '公开';
    this.pushLog({ timestamp: new Date().toISOString(), level: 'INFO', message: `开始执行任务 ${task.taskId}，将 ${task.videoIds.length} 个视频设为${privacyText}` });

    let successCount = 0;
    let failCount = 0;

    for (const bvid of task.videoIds) {
      try {
        const success = await this.biliApi.setPrivacy(bvid, task.setPrivate);
        if (success) {
          successCount++;
          this.pushLog({ timestamp: new Date().toISOString(), level: 'SUCCESS', message: `视频 ${bvid} 设置成功` });
        } else {
          failCount++;
          this.pushLog({ timestamp: new Date().toISOString(), level: 'ERROR', message: `视频 ${bvid} 设置失败` });
        }
      } catch (error: any) {
        failCount++;
        this.pushLog({ timestamp: new Date().toISOString(), level: 'ERROR', message: `视频 ${bvid} 执行异常: ${error.message}` });
      }
    }

    this.pushLog({ timestamp: new Date().toISOString(), level: 'INFO', message: `任务 ${task.taskId} 执行完成：成功 ${successCount}，失败 ${failCount}` });
  }

  /** 推送日志到渲染进程 */
  private pushLog(entry: LogEntry): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(IPC.LOG_APPEND, entry);
    }
    // 控制台也输出一份
    const emoji = entry.level === 'SUCCESS' ? '✅' : entry.level === 'ERROR' ? '❌' : '📋';
    console.log(`${emoji} [${entry.level}] ${entry.message}`);
  }
}
