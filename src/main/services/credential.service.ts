/**
 * 凭证加密存储服务
 * 使用 AES-256-GCM 加密 + JSON 文件存储
 * 对标原项目 config_manager.py
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

/** 配置目录（对标 ~/.bili_scheduler） */
const CONFIG_DIR = path.join(os.homedir(), '.bili-scheduler-electron');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.enc');
const TASKS_FILE = path.join(CONFIG_DIR, 'tasks.json');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

/** 加密参数 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT = 'bili-visibility-scheduler-electron-salt-v1';

/** 从固定密钥派生加密密钥 */
function deriveKey(): Buffer {
  return crypto.scryptSync(
    'bili-visibility-scheduler-electron-secret',
    SALT,
    KEY_LENGTH
  );
}

/** 确保配置目录存在 */
function ensureDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/** 加密数据 */
function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({ iv: iv.toString('hex'), tag, data: encrypted });
}

/** 解密数据 */
function decrypt(encryptedJson: string): string | null {
  try {
    const { iv, tag, data } = JSON.parse(encryptedJson);
    const key = deriveKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

/** 安全读取 JSON 文件 */
function readJSON(filePath: string, defaultValue: any = {}): any {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch { /* ignore */ }
  return defaultValue;
}

/** 安全写入 JSON 文件 */
function writeJSON(filePath: string, data: any): void {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const CredentialService = {
  /** 保存加密凭证 */
  save(sessdata: string, biliJct: string, dedeUserId: string): void {
    ensureDir();
    const plaintext = JSON.stringify({ sessdata, biliJct, dedeUserId });
    const encrypted = encrypt(plaintext);
    fs.writeFileSync(CONFIG_FILE, encrypted, 'utf-8');
  },

  /** 加载并解密凭证 */
  load(): { sessdata: string; biliJct: string; dedeUserId: string } | null {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    try {
      const encrypted = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const plaintext = decrypt(encrypted);
      if (!plaintext) return null;
      return JSON.parse(plaintext);
    } catch {
      return null;
    }
  },

  /** 清除凭证 */
  clear(): void {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  },

  /** 检查是否有已保存的凭证 */
  hasCredential(): boolean {
    return fs.existsSync(CONFIG_FILE);
  },

  // ==================== 任务存储 ====================

  saveTasks(tasks: Record<string, any>): void {
    writeJSON(TASKS_FILE, tasks);
  },

  loadTasks(): Record<string, any> {
    return readJSON(TASKS_FILE, {});
  },

  // ==================== 主题/设置存储 ====================

  getTheme(): string {
    return readJSON(SETTINGS_FILE, {}).theme || 'light';
  },

  setTheme(theme: string): void {
    const settings = readJSON(SETTINGS_FILE, {});
    settings.theme = theme;
    writeJSON(SETTINGS_FILE, settings);
  },

  getSettings(): { theme: string; autoStart: boolean; minimizeToTray: boolean } {
    return readJSON(SETTINGS_FILE, {
      theme: 'light',
      autoStart: false,
      minimizeToTray: true,
    });
  },

  setSetting(key: string, value: any): void {
    const settings = readJSON(SETTINGS_FILE, {});
    settings[key] = value;
    writeJSON(SETTINGS_FILE, settings);
  },
};
