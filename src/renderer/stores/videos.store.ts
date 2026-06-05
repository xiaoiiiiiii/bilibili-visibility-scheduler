/** 视频状态管理 */
import { create } from 'zustand';
import type { VideoInfo } from '../../shared/types';

interface VideosState {
  videos: VideoInfo[];
  isLoading: boolean;
  error: string | null;
  selectedBvids: string[];

  fetchVideos: () => Promise<void>;
  toggleSelect: (bvid: string) => void;
  selectAll: () => void;
  selectNone: () => void;
  setPrivacy: (bvid: string, isPrivate: boolean) => Promise<boolean>;
  batchSetPrivacy: (isPrivate: boolean) => Promise<{ success: number; fail: number }>;
}

export const useVideosStore = create<VideosState>((set, get) => ({
  videos: [],
  isLoading: false,
  error: null,
  selectedBvids: [],

  fetchVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.getVideoList();
      if (result.success && result.data) {
        set({ videos: result.data, isLoading: false });
      } else {
        set({ error: result.error || '获取视频失败', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || '获取视频异常', isLoading: false });
    }
  },

  toggleSelect: (bvid: string) => {
    const { selectedBvids } = get();
    if (selectedBvids.includes(bvid)) {
      set({ selectedBvids: selectedBvids.filter((id) => id !== bvid) });
    } else {
      set({ selectedBvids: [...selectedBvids, bvid] });
    }
  },

  selectAll: () => {
    const { videos } = get();
    set({ selectedBvids: videos.map((v) => v.bvid) });
  },

  selectNone: () => {
    set({ selectedBvids: [] });
  },

  setPrivacy: async (bvid: string, isPrivate: boolean) => {
    const { videos } = get();
    const video = videos.find(v => v.bvid === bvid);
    const title = video?.title || '未知标题';
    const result = await window.electronAPI.setPrivacy(bvid, title, isPrivate);
    if (result.success && result.data) {
      // 更新本地视频状态
      set({
        videos: videos.map((v) =>
          v.bvid === bvid ? { ...v, is_only_self: isPrivate ? 1 : 0 } : v
        ),
      });
      return true;
    }
    return false;
  },

  batchSetPrivacy: async (isPrivate: boolean) => {
    const { selectedBvids, videos } = get();
    let success = 0;
    let fail = 0;

    for (const bvid of selectedBvids) {
      const video = videos.find(v => v.bvid === bvid);
      const title = video?.title || '未知标题';
      const result = await window.electronAPI.setPrivacy(bvid, title, isPrivate);
      if (result.success && result.data) {
        success++;
      } else {
        fail++;
      }
    }

    // 刷新视频列表以获取最新状态
    if (success > 0) {
      set({
        videos: videos.map((v) =>
          get().selectedBvids.includes(v.bvid)
            ? { ...v, is_only_self: isPrivate ? 1 : 0 }
            : v
        ),
        selectedBvids: [],
      });
    }

    return { success, fail };
  },
}));
