export type LightType = 'constant' | 'selective';
export type PositionType = 'before_char' | 'after_char' | 'description';
export type AppMode = 'character' | 'worldbook';

export interface ScannedFile {
  filename: string;
  relPath: string;
  fullPath: string;
  isValid: boolean;
  errorMsg: string | null;
  fileType?: 'json' | 'yaml' | 'xml' | 'text';
}

export interface EntryConfig {
  triggerKey: string;
  lightType: LightType;
  position: PositionType;
  enabled: boolean;
}

export interface MergedEntry extends ScannedFile, EntryConfig {
  isNew: boolean;
}

export interface CardMeta {
  cardName: string;
  tags: string;
  cardDescription: string;
  firstMes: string;
  creator: string;
  characterVersion: string;
}

export interface WorldbookMeta {
  name: string;
  description: string;
  scanDepth?: number;
  tokenBudget?: number;
  recursiveScanning?: boolean;
}

export interface ProjectDetail {
  name: string;
  meta: CardMeta;
  entries: MergedEntry[];
  snapshotLastUpdated: string | null;
}

export interface WorldbookDetail {
  name: string;
  meta: WorldbookMeta;
  entries: MergedEntry[];
  snapshotLastUpdated: string | null;
}

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

export type ExportCardRequest = SaveSnapshotRequest;

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

export type ExportWorldbookRequest = SaveWorldbookRequest;

export interface ConfigData {
  workspaceRoot: string;
  defaultWorkspaceRoot: string;
  worldbookWorkspaceRoot: string;
  defaultWorldbookWorkspaceRoot: string;
  exists: boolean;
  projects: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
