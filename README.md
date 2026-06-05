# 📺 B站视频可见性定时器

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Electron](https://img.shields.io/badge/Electron-42-9feaf9?logo=electron)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

**基于 Electron 的 B站视频可见性批量管理桌面应用**

支持定时/立即修改视频可见性，深色/浅色主题切换

</div>

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔐 Cookie 登录 | 使用 B站 SESSDATA 凭证登录，AES-256-GCM 加密存储 |
| 🎬 视频管理 | 获取账号下所有视频，支持搜索、筛选、排序、封面预览 |
| ⚡ 立即执行 | 选中视频即刻修改可见性（公开/仅自己可见），含进度条 |
| ⏰ 定时任务 | 每日指定时间自动执行，支持 CRUD、立即触发 |
| 📊 仪表盘 | 视频统计概览，卡片一键跳转筛选 |
| 📋 操作日志 | 实时记录所有操作，支持导出 |
| 🌓 主题切换 | 深色/浅色模式一键切换，Ant Design 5 原生支持 |
| 📌 系统托盘 | 最小化到托盘后台运行，右键快捷菜单 |
| 🔔 系统通知 | 任务完成时弹出系统通知 |
| 🚀 开机自启 | 可配置开机自动启动 |

## 🖥️ 界面预览

```
┌─────────────────────────────────────────────────┐
│ 📺 B站视频可见性定时器          ☀️ 🔔 📋 用户名 │
├──────────┬──────────────────────────────────────┤
│ 📊 仪表盘 │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│ 🎬 视频   │  │总数42│ │公开30│ │私有12│ │任务3 │  │
│ ⏰ 任务   │  └─────┘ └─────┘ └─────┘ └─────┘  │
│ ⚙️ 设置   │  ⏱️ 调度器状态: 运行中              │
│          │  📋 最近操作日志...                  │
├──────────┴──────────────────────────────────────┤
│ 📋 操作日志 (底部可折叠面板)                      │
└─────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 下载使用（推荐）

从 [Releases](../../releases) 页面下载最新 `B站视频可见性定时器-Setup.exe` 安装包，双击安装即可。

### 开发运行

```bash
# 克隆仓库
git clone https://github.com/xiaoiiiiiii/bilibili-visibility-scheduler.git
cd bilibili-visibility-scheduler

# 安装依赖
npm install --legacy-peer-deps

# 开发模式
npm run dev:renderer    # 终端1：启动 Vite
npx electron dist/main/index.js  # 终端2：启动 Electron (需设置 NODE_ENV=development)

# 构建生产版本
npm run build:renderer
npm run build:main

# 打包安装程序
npm run build
```

### 获取 B站 Cookie 凭证

1. 浏览器登录 [B站](https://www.bilibili.com)
2. 按 `F12` → 应用/Application → Cookies → `bilibili.com`
3. 复制 `SESSDATA`、`bili_jct`、`DedeUserID` 的值
4. 粘贴到应用登录窗口中

> ⚠️ Cookie 凭证使用 AES-256-GCM 加密存储在 `~/.bili-scheduler-electron/config.enc`，请勿泄露！

## 🛠️ 技术栈

| 层面 | 技术 |
|------|------|
| 桌面框架 | Electron 42 |
| 前端框架 | React 19 + TypeScript |
| UI 组件库 | Ant Design 5 |
| 样式方案 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 构建工具 | Vite 6 + electron-builder |
| 定时任务 | node-cron |
| 加密切削 | AES-256-GCM (Node.js crypto) |
| HTTP 请求 | axios |
| 路由 | React Router 7 |

## 📁 项目结构

```
bilibili-visibility-scheduler/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口：窗口、托盘、生命周期
│   │   ├── ipc/                 # IPC 处理器
│   │   │   ├── auth.ipc.ts      # 登录/登出
│   │   │   ├── videos.ipc.ts    # 视频列表/可见性
│   │   │   ├── tasks.ipc.ts     # 任务 CRUD
│   │   │   └── scheduler.ipc.ts # 调度器控制
│   │   └── services/
│   │       ├── bili-api.service.ts    # B站 API 封装
│   │       ├── scheduler.service.ts   # node-cron 调度引擎
│   │       └── credential.service.ts  # 凭证加密存储
│   ├── preload/
│   │   └── index.ts             # contextBridge 安全桥接
│   ├── renderer/                # React 渲染进程
│   │   ├── pages/               # 4 个页面（仪表盘/视频/任务/设置）
│   │   ├── components/          # UI 组件
│   │   ├── stores/              # Zustand 状态管理
│   │   └── styles/              # 全局样式
│   └── shared/                  # 共享类型和常量
├── resources/                   # 图标资源
├── package.json
└── vite.renderer.config.ts
```

## 📄 License

MIT © Taffy

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

</div>
