// 条目条件类型
export type LightType = 'constant' | 'selective';

// 注入位置
export type PositionType = 'before_char' | 'after_char' | 'description';

// 运行模式：角色卡模式 或 世界书模式
export type AppMode = 'character' | 'worldbook';

// 扫描到的文件信息
export interface ScannedFile {
  filename: string;
  relPath: string;
  fullPath: string;
  isValid: boolean;
  errorMsg: string | null;
  fileType?: 'json' | 'yaml' | 'xml' | 'text';
}

// 快照中的条目配置
export interface EntryConfig {
  triggerKey: string;
  lightType: LightType;
  position: PositionType;
  enabled: boolean;
}

// 合并后的完整条目（给前端用）
export interface MergedEntry extends ScannedFile, EntryConfig {
  isNew: boolean;
}

// 角色卡元数据
export interface CardMeta {
  cardName: string;
  tags: string;
  cardDescription: string;
  firstMes: string;
  creator: string;
  characterVersion: string;
}

// 世界书元数据
export interface WorldbookMeta {
  name: string;
  description: string;
  scanDepth?: number;
  tokenBudget?: number;
  recursiveScanning?: boolean;
}

// 快照文件结构（角色卡）
export interface Snapshot {
  projectName: string;
  lastUpdated: string | null;
  meta: CardMeta;
  entries: Record<string, EntryConfig>;
}

// 快照文件结构（世界书）
export interface WorldbookSnapshot {
  projectName: string;
  lastUpdated: string | null;
  meta: WorldbookMeta;
  entries: Record<string, EntryConfig>;
}

// 工程详情（GET /api/projects/:name 返回）
export interface ProjectDetail {
  name: string;
  meta: CardMeta;
  entries: MergedEntry[];
  snapshotLastUpdated: string | null;
}

// 世界书工程详情（GET /api/worldbooks/:name 返回）
export interface WorldbookDetail {
  name: string;
  meta: WorldbookMeta;
  entries: MergedEntry[];
  snapshotLastUpdated: string | null;
}

// 保存快照的请求体
export interface SaveSnapshotRequest {
  meta: CardMeta;
  entries: Array<{
    relPath: string;
    triggerKey: string;
    lightType: LightType;
    position: PositionType;
    enabled: boolean;
  }>;
}

// 导出卡片的请求体（与保存快照相同）
export type ExportCardRequest = SaveSnapshotRequest;

// 保存世界书快照的请求体
export interface SaveWorldbookRequest {
  meta?: Partial<WorldbookMeta>;
  entries: Array<{
    relPath: string;
    triggerKey: string;
    lightType: LightType;
    position: PositionType;
    enabled: boolean;
  }>;
}

// 导出世界书的请求体
export type ExportWorldbookRequest = SaveWorldbookRequest;

// 配置数据
export interface ConfigData {
  workspaceRoot: string;
  defaultWorkspaceRoot: string;
  worldbookWorkspaceRoot: string;
  defaultWorldbookWorkspaceRoot: string;
  exists: boolean;
  projects: string[];
}

// 通用 API 响应包装
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
