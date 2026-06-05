/**
 * B站 API 服务
 * 对标原项目 bili_api.py，封装所有 B站创作中心 API 调用
 * 在主进程中运行，使用 axios 发起 HTTP 请求
 */
import axios, { AxiosInstance } from 'axios';
import { VideoInfo, UserInfo } from '../../shared/types';

/** B站 API 基础 URL */
const BILI_API_BASE = 'https://member.bilibili.com';
const BILI_MAIN_API = 'https://api.bilibili.com';

export class BiliApiService {
  private sessdata: string;
  private biliJct: string;
  private dedeUserId: string;
  private client: AxiosInstance;

  constructor(sessdata: string, biliJct: string, dedeUserId: string) {
    this.sessdata = sessdata;
    this.biliJct = biliJct;
    this.dedeUserId = dedeUserId;

    this.client = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://member.bilibili.com/',
        Origin: 'https://member.bilibili.com',
      },
    });
  }

  /** 获取凭证 Cookie 字符串 */
  private get cookies(): Record<string, string> {
    return {
      SESSDATA: this.sessdata,
      bili_jct: this.biliJct,
      DedeUserID: this.dedeUserId,
    };
  }

  // ==================== 登录验证 ====================

  /** 验证登录状态并获取用户信息 */
  async verifyCredential(): Promise<UserInfo> {
    try {
      const response = await this.client.get(`${BILI_MAIN_API}/x/web-interface/nav`, {
        headers: { Cookie: this.buildCookieString() },
      });
      const data = response.data;
      if (data.code !== 0) {
        throw new Error(`登录验证失败: ${data.message}`);
      }
      return {
        uid: String(data.data.mid),
        name: data.data.uname,
        face: data.data.face,
      };
    } catch (error: any) {
      if (error.message?.includes('登录验证失败')) {
        throw error;
      }
      throw new Error(`登录凭证无效: ${error.message}`);
    }
  }

  // ==================== 视频列表获取 ====================

  /** 获取单页视频列表 */
  private async fetchArchivesPage(
    pn: number,
    ps: number = 30
  ): Promise<{ archives: VideoInfo[]; total: number }> {
    const response = await this.client.get(`${BILI_API_BASE}/x/web/archives`, {
      params: {
        status: 'is_pubing,pubed,not_pubed',
        pn,
        ps,
        coop: 1,
        interactive: 1,
      },
      headers: { Cookie: this.buildCookieString() },
    });

    const data = response.data;
    if (data.code !== 0) {
      throw new Error(`API 错误: ${data.message}`);
    }

    const archives = data.data?.arc_audits || [];
    const result: VideoInfo[] = [];

    for (const item of archives) {
      const archive = item.Archive || {};
      result.push({
        aid: archive.aid,
        bvid: archive.bvid,
        title: archive.title,
        created: archive.ctime || 0,
        is_only_self: archive.is_only_self ?? 0,
        state: archive.state,
        // B站部分老视频封面是 http://，转为 https:// 避免 CSP 拦截
        cover: (archive.cover || '').replace(/^http:\/\//, 'https://'),
      });
    }

    return {
      archives: result,
      total: data.data?.page?.count || 0,
    };
  }

  /** 获取所有视频（处理分页） */
  async getAllVideos(): Promise<VideoInfo[]> {
    const allVideos: VideoInfo[] = [];
    let pn = 1;
    const ps = 30;

    while (true) {
      const { archives, total } = await this.fetchArchivesPage(pn, ps);
      allVideos.push(...archives);

      if (allVideos.length >= total || archives.length === 0) {
        break;
      }
      pn++;
    }

    return allVideos;
  }

  // ==================== 可见性修改 ====================

  /** 获取视频的 aid（通过 bvid） */
  private async getAidByBvid(bvid: string): Promise<number> {
    const response = await this.client.get(`${BILI_MAIN_API}/x/web-interface/view`, {
      params: { bvid },
      headers: { Cookie: this.buildCookieString() },
    });

    const data = response.data;
    if (data.code !== 0) {
      throw new Error(`获取视频信息失败: ${data.message}`);
    }

    return data.data.aid;
  }

  /** 设置视频可见性 */
  async setPrivacy(bvid: string, isPrivate: boolean): Promise<boolean> {
    try {
      // 先获取 aid
      const aid = await this.getAidByBvid(bvid);

      // 调用可见性修改 API
      const response = await this.client.post(
        `${BILI_API_BASE}/x/vu/web/edit/visibility`,
        new URLSearchParams({
          aid: String(aid),
          is_only_self: isPrivate ? '1' : '0',
          csrf: this.biliJct,
        }).toString(),
        {
          params: { csrf: this.biliJct },
          headers: {
            Cookie: this.buildCookieString(),
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
        }
      );

      const result = response.data;
      return result.code === 0;
    } catch (error: any) {
      console.error(`设置视频 ${bvid} 可见性失败:`, error.message);
      return false;
    }
  }

  /** 构建 Cookie 字符串 */
  private buildCookieString(): string {
    return `SESSDATA=${this.sessdata}; bili_jct=${this.biliJct}; DedeUserID=${this.dedeUserId}`;
  }

  /** 获取原始凭证（用于存储） */
  getCredentials(): { sessdata: string; biliJct: string; dedeUserId: string } {
    return {
      sessdata: this.sessdata,
      biliJct: this.biliJct,
      dedeUserId: this.dedeUserId,
    };
  }
}
