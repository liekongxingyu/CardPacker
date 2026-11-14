import path from 'path';
import fs from 'fs';
import { AppMode } from './types';

/**
 * 默认角色卡工作区根目录
 */
export const DEFAULT_WORKSPACE_ROOT: string =
  process.env.WORKSPACE_ROOT || 'D:\\BaiduSyncdisk\\文件\\个人\\世界书';

/**
 * 默认世界书工作区根目录（默认与角色卡相同或支持单独指定）
 */
export const DEFAULT_WORLDBOOK_WORKSPACE_ROOT: string =
  process.env.WORLDBOOK_WORKSPACE_ROOT || DEFAULT_WORKSPACE_ROOT;

/**
 * 用户配置持久化文件路径（保存在 server 根目录下）
 */
const SETTINGS_FILE: string = path.resolve(__dirname, '..', 'user_settings.json');

interface UserSettings {
  workspaceRoot?: string;
  worldbookWorkspaceRoot?: string;
}

function loadPersistedSettings(): UserSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (typeof data === 'object' && data !== null) {
        return data as UserSettings;
      }
    }
  } catch (e) {
    console.warn('[Config] 读取 user_settings.json 失败，使用默认路径:', e);
  }
  return {};
}

const initialSettings = loadPersistedSettings();
let activeWorkspaceRoot: string =
  initialSettings.workspaceRoot?.trim() || DEFAULT_WORKSPACE_ROOT;
let activeWorldbookWorkspaceRoot: string =
  initialSettings.worldbookWorkspaceRoot?.trim() || DEFAULT_WORLDBOOK_WORKSPACE_ROOT;

function persistSettings(): void {
  try {
    const payload: UserSettings = {
      workspaceRoot: activeWorkspaceRoot,
      worldbookWorkspaceRoot: activeWorldbookWorkspaceRoot,
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Config] 写入 user_settings.json 失败:', e);
  }
}

/**
 * 获取指定模式的工作区根目录
 */
export function getWorkspaceRoot(mode: AppMode = 'character'): string {
  return mode === 'worldbook' ? activeWorldbookWorkspaceRoot : activeWorkspaceRoot;
}

/**
 * 设置并持久化指定模式的工作区根目录
 */
export function setWorkspaceRoot(newPath: string, mode: AppMode = 'character'): void {
  const trimmed = newPath.trim();
  if (mode === 'worldbook') {
    activeWorldbookWorkspaceRoot = trimmed;
  } else {
    activeWorkspaceRoot = trimmed;
  }
  persistSettings();
}

/**
 * 重置指定模式的工作区根目录为默认值
 */
export function resetWorkspaceRoot(mode: AppMode = 'character'): string {
  if (mode === 'worldbook') {
    setWorkspaceRoot(DEFAULT_WORLDBOOK_WORKSPACE_ROOT, 'worldbook');
    return DEFAULT_WORLDBOOK_WORKSPACE_ROOT;
  }
  setWorkspaceRoot(DEFAULT_WORKSPACE_ROOT, 'character');
  return DEFAULT_WORKSPACE_ROOT;
}

/**
 * 兼容旧代码直接引用的 WORKSPACE_ROOT
 */
export const WORKSPACE_ROOT: string = activeWorkspaceRoot;

/**
 * 快照存放目录（位于 server/snapshots/）
 */
export const SNAPSHOTS_DIR: string =
  process.env.SNAPSHOTS_DIR || path.resolve(__dirname, '..', 'snapshots');

/**
 * 世界书快照存放目录
 */
export const WORLDBOOK_SNAPSHOTS_DIR: string = path.join(SNAPSHOTS_DIR, 'worldbook');

/**
 * 排除不作为工程文件夹的目录名
 */
export const EXCLUDED_DIRS: Set<string> = new Set([
  '__pycache__',
  '.git',
  '.vscode',
  '.idea',
  'card_packer',
  '.gemini',
  'node_modules',
  'snapshots',
]);

/**
 * 默认角色卡作者与版本
 */
export const DEFAULT_CREATOR = 'Antigravity';
export const DEFAULT_VERSION = '1.0.0';

/**
 * 注入位置 → SillyTavern extensions.position 数值映射
 */
export const POS_MAP: Record<string, number> = {
  before_char: 0,
  after_char: 1,
  description: 3,
};
