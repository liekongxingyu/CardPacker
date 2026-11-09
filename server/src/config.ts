import path from 'path';
import fs from 'fs';

/**
 * 默认工作区根目录
 */
export const DEFAULT_WORKSPACE_ROOT: string =
  process.env.WORKSPACE_ROOT || 'D:\\BaiduSyncdisk\\文件\\个人\\世界书';

/**
 * 用户配置持久化文件路径（保存在 server 根目录下）
 */
const SETTINGS_FILE: string = path.resolve(__dirname, '..', 'user_settings.json');

/**
 * 加载持久化的工作区根目录配置
 */
function loadPersistedWorkspaceRoot(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (typeof data.workspaceRoot === 'string' && data.workspaceRoot.trim()) {
        return data.workspaceRoot.trim();
      }
    }
  } catch (e) {
    console.warn('[Config] 读取 user_settings.json 失败，使用默认路径:', e);
  }
  return DEFAULT_WORKSPACE_ROOT;
}

let activeWorkspaceRoot: string = loadPersistedWorkspaceRoot();

/**
 * 获取当前工作区根目录
 */
export function getWorkspaceRoot(): string {
  return activeWorkspaceRoot;
}

/**
 * 设置并持久化新的工作区根目录
 */
export function setWorkspaceRoot(newPath: string): void {
  activeWorkspaceRoot = newPath.trim();
  try {
    const payload = { workspaceRoot: activeWorkspaceRoot };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Config] 写入 user_settings.json 失败:', e);
  }
}

/**
 * 重置工作区根目录为默认值
 */
export function resetWorkspaceRoot(): string {
  setWorkspaceRoot(DEFAULT_WORKSPACE_ROOT);
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
