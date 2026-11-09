export type LightType = 'constant' | 'selective';
export type PositionType = 'before_char' | 'after_char' | 'description';

export interface ScannedFile {
  filename: string;
  relPath: string;
  fullPath: string;
  isValid: boolean;
  errorMsg: string | null;
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

export interface ProjectDetail {
  name: string;
  meta: CardMeta;
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

export interface ConfigData {
  workspaceRoot: string;
  defaultWorkspaceRoot: string;
  exists: boolean;
  projects: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
