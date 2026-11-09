// 条目条件类型
export type LightType = 'constant' | 'selective';

// 注入位置
export type PositionType = 'before_char' | 'after_char' | 'description';

// 扫描到的文件信息
export interface ScannedFile {
  filename: string;
  relPath: string;
  fullPath: string;
  isValid: boolean;
  errorMsg: string | null;
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

// 快照文件结构
export interface Snapshot {
  projectName: string;
  lastUpdated: string | null;
  meta: CardMeta;
  entries: Record<string, EntryConfig>;
}

// 工程详情（GET /api/projects/:name 返回）
export interface ProjectDetail {
  name: string;
  meta: CardMeta;
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

// 通用 API 响应包装
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
