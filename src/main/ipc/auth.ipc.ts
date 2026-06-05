/**
 * 认证相关 IPC 处理器
 */
import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { BiliApiService } from '../services/bili-api.service';
import { CredentialService } from '../services/credential.service';
import { ApiResult, UserInfo } from '../../shared/types';

/** 全局 B站 API 实例引用 */
let currentApi: BiliApiService | null = null;

/** 获取当前 API 实例 */
export function getCurrentApi(): BiliApiService | null {
  return currentApi;
}

/** 注册认证 IPC 处理器 */
export function registerAuthIPC(): void {
  // 登录
  ipcMain.handle(IPC.AUTH_LOGIN, async (_event, sessdata: string, biliJct: string, dedeUserId: string): Promise<ApiResult<UserInfo>> => {
    try {
      if (!sessdata || !biliJct || !dedeUserId) {
        return { success: false, error: '所有字段必须填写' };
      }

      const api = new BiliApiService(sessdata, biliJct, dedeUserId);
      const userInfo = await api.verifyCredential();

      // 登录成功，保存凭证
      currentApi = api;
      CredentialService.save(sessdata, biliJct, dedeUserId);

      return { success: true, data: userInfo };
    } catch (error: any) {
      return { success: false, error: error.message || '登录失败' };
    }
  });

  // 退出登录
  ipcMain.handle(IPC.AUTH_LOGOUT, async () => {
    currentApi = null;
    CredentialService.clear();
  });

  // 检查登录状态（自动登录）
  ipcMain.handle(IPC.AUTH_CHECK, async (): Promise<ApiResult<UserInfo | null>> => {
    try {
      const credential = CredentialService.load();
      if (!credential) {
        return { success: true, data: null };
      }

      const api = new BiliApiService(credential.sessdata, credential.biliJct, credential.dedeUserId);
      const userInfo = await api.verifyCredential();

      currentApi = api;
      return { success: true, data: userInfo };
    } catch (error: any) {
      return { success: true, data: null };
    }
  });
}

/** 获取当前 API 实例（用于其他 IPC 模块） */
export function useApi(): BiliApiService {
  if (!currentApi) {
    throw new Error('未登录，请先登录');
  }
  return currentApi;
}
