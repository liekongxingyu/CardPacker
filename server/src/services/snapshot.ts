import fs from 'fs';
import path from 'path';
import {
  Snapshot,
  CardMeta,
  EntryConfig,
  LightType,
  PositionType,
  MergedEntry,
  ScannedFile,
  WorldbookSnapshot,
  WorldbookMeta,
} from '../types';
import {
  SNAPSHOTS_DIR,
  WORLDBOOK_SNAPSHOTS_DIR,
  DEFAULT_CREATOR,
  DEFAULT_VERSION,
} from '../config';

/** 确保快照目录存在 */
function ensureSnapshotsDir(isWorldbook = false): void {
  const targetDir = isWorldbook ? WORLDBOOK_SNAPSHOTS_DIR : SNAPSHOTS_DIR;
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
}

/** 获取指定工程的快照文件路径 */
function getSnapshotPath(projectName: string): string {
  ensureSnapshotsDir(false);
  return path.join(SNAPSHOTS_DIR, `${projectName}.json`);
}

/** 获取指定世界书工程的快照文件路径 */
function getWorldbookSnapshotPath(projectName: string): string {
  ensureSnapshotsDir(true);
  return path.join(WORLDBOOK_SNAPSHOTS_DIR, `${projectName}.json`);
}

// ─────────────────────────────────────────────────────────────
// 角色卡快照
// ─────────────────────────────────────────────────────────────

/** 加载指定工程的快照，若不存在则返回默认空快照 */
export function loadSnapshot(projectName: string): Snapshot {
  const snapshotPath = getSnapshotPath(projectName);

  if (fs.existsSync(snapshotPath)) {
    try {
      const content = fs.readFileSync(snapshotPath, 'utf-8');
      return JSON.parse(content) as Snapshot;
    } catch (e) {
      console.warn(`[Warning] Failed to load snapshot for ${projectName}:`, e);
    }
  }

  // 返回默认空快照
  return {
    projectName,
    lastUpdated: null,
    meta: {
      cardName: projectName,
      tags: '',
      cardDescription: '',
      firstMes: '',
      creator: DEFAULT_CREATOR,
      characterVersion: DEFAULT_VERSION,
    },
    entries: {},
  };
}

/**
 * 保存当前工程快照到 snapshots/{projectName}.json
 * @returns 保存时间戳（ISO 8601 UTC）
 */
export function saveSnapshot(
  projectName: string,
  meta: CardMeta,
  entries: Array<{
    relPath: string;
    triggerKey: string;
    lightType: LightType;
    position: PositionType;
    enabled: boolean;
  }>
): string {
  ensureSnapshotsDir(false);

  const nowStr = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const snapshotPath = getSnapshotPath(projectName);

  const entriesRecord: Record<string, EntryConfig> = {};
  for (const entry of entries) {
    entriesRecord[entry.relPath] = {
      triggerKey: entry.triggerKey,
      lightType: entry.lightType,
      position: entry.position,
      enabled: entry.enabled,
    };
  }

  const snapshot: Snapshot = {
    projectName,
    lastUpdated: nowStr,
    meta,
    entries: entriesRecord,
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return nowStr;
}

/**
 * 将扫描到的实际文件与快照配置进行智能增量合并
 */
export function mergeWithSnapshot(
  scannedFiles: ScannedFile[],
  snapshot: Snapshot
): { meta: CardMeta; entries: MergedEntry[] } {
  const savedMeta = snapshot.meta;
  const meta: CardMeta = {
    cardName: savedMeta.cardName || snapshot.projectName,
    tags: savedMeta.tags ?? '',
    cardDescription: savedMeta.cardDescription ?? '',
    firstMes: savedMeta.firstMes ?? '',
    creator: savedMeta.creator || DEFAULT_CREATOR,
    characterVersion: savedMeta.characterVersion || DEFAULT_VERSION,
  };

  const savedEntries = snapshot.entries ?? {};
  const mergedList: MergedEntry[] = [];

  for (const file of scannedFiles) {
    const { relPath, filename } = file;
    const baseName = path.basename(filename, path.extname(filename));

    let triggerKey: string;
    let lightType: LightType;
    let position: PositionType;
    let enabled: boolean;
    let isNew: boolean;

    if (relPath in savedEntries) {
      // 继承快照配置（若无有效触发词则回退到文件名默认值）
      const cfg = savedEntries[relPath];
      triggerKey = cfg.triggerKey?.trim() ? cfg.triggerKey.trim() : baseName;
      lightType = cfg.lightType ?? 'selective';
      position = cfg.position ?? 'before_char';
      enabled = cfg.enabled ?? true;
      isNew = false;
    } else {
      // 新文件：智能默认策略
      const isBackground = ['背景', '世界观', '设定'].some((kw) =>
        relPath.includes(kw)
      );
      lightType = isBackground ? 'constant' : 'selective';
      triggerKey = baseName;
      position = 'before_char';
      enabled = true;
      isNew = true;
    }

    mergedList.push({
      filename: file.filename,
      relPath: file.relPath,
      fullPath: file.fullPath,
      isValid: file.isValid,
      errorMsg: file.errorMsg,
      fileType: file.fileType,
      triggerKey,
      lightType,
      position,
      enabled,
      isNew,
    });
  }

  return { meta, entries: mergedList };
}

// ─────────────────────────────────────────────────────────────
// 世界书快照
// ─────────────────────────────────────────────────────────────

/** 加载指定世界书工程的快照 */
export function loadWorldbookSnapshot(projectName: string): WorldbookSnapshot {
  const snapshotPath = getWorldbookSnapshotPath(projectName);

  if (fs.existsSync(snapshotPath)) {
    try {
      const content = fs.readFileSync(snapshotPath, 'utf-8');
      return JSON.parse(content) as WorldbookSnapshot;
    } catch (e) {
      console.warn(`[Warning] Failed to load worldbook snapshot for ${projectName}:`, e);
    }
  }

  return {
    projectName,
    lastUpdated: null,
    meta: {
      name: projectName,
      description: '',
      scanDepth: 100,
      tokenBudget: 2048,
      recursiveScanning: true,
    },
    entries: {},
  };
}

/** 保存世界书工程快照 */
export function saveWorldbookSnapshot(
  projectName: string,
  meta: Partial<WorldbookMeta> | undefined,
  entries: Array<{
    relPath: string;
    triggerKey: string;
    lightType: LightType;
    position: PositionType;
    enabled: boolean;
  }>
): string {
  ensureSnapshotsDir(true);

  const nowStr = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const snapshotPath = getWorldbookSnapshotPath(projectName);

  const entriesRecord: Record<string, EntryConfig> = {};
  for (const entry of entries) {
    entriesRecord[entry.relPath] = {
      triggerKey: entry.triggerKey,
      lightType: entry.lightType,
      position: entry.position,
      enabled: entry.enabled,
    };
  }

  const existing = loadWorldbookSnapshot(projectName);
  const snapshot: WorldbookSnapshot = {
    projectName,
    lastUpdated: nowStr,
    meta: {
      ...existing.meta,
      ...meta,
      name: meta?.name || existing.meta.name || projectName,
    },
    entries: entriesRecord,
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return nowStr;
}

/** 世界书扫描结果与快照合并 */
export function mergeWorldbookWithSnapshot(
  scannedFiles: ScannedFile[],
  snapshot: WorldbookSnapshot
): { meta: WorldbookMeta; entries: MergedEntry[] } {
  const savedMeta = snapshot.meta || {};
  const meta: WorldbookMeta = {
    name: savedMeta.name || snapshot.projectName,
    description: savedMeta.description || '',
    scanDepth: savedMeta.scanDepth ?? 100,
    tokenBudget: savedMeta.tokenBudget ?? 2048,
    recursiveScanning: savedMeta.recursiveScanning ?? true,
  };

  const savedEntries = snapshot.entries ?? {};
  const mergedList: MergedEntry[] = [];

  for (const file of scannedFiles) {
    const { relPath, filename } = file;
    const baseName = path.basename(filename, path.extname(filename));

    let triggerKey: string;
    let lightType: LightType;
    let position: PositionType;
    let enabled: boolean;
    let isNew: boolean;

    if (relPath in savedEntries) {
      // 继承快照配置（若无有效触发词则回退到文件名默认值）
      const cfg = savedEntries[relPath];
      triggerKey = cfg.triggerKey?.trim() ? cfg.triggerKey.trim() : baseName;
      lightType = cfg.lightType ?? 'selective';
      position = cfg.position ?? 'before_char';
      enabled = cfg.enabled ?? true;
      isNew = false;
    } else {
      const isBackground = ['背景', '世界观', '设定'].some((kw) =>
        relPath.includes(kw)
      );
      lightType = isBackground ? 'constant' : 'selective';
      triggerKey = baseName;
      position = 'before_char';
      enabled = true;
      isNew = true;
    }

    mergedList.push({
      filename: file.filename,
      relPath: file.relPath,
      fullPath: file.fullPath,
      isValid: file.isValid,
      errorMsg: file.errorMsg,
      fileType: file.fileType,
      triggerKey,
      lightType,
      position,
      enabled,
      isNew,
    });
  }

  return { meta, entries: mergedList };
}
