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
} from '../types';
import {
  SNAPSHOTS_DIR,
  DEFAULT_CREATOR,
  DEFAULT_VERSION,
} from '../config';

/** 确保快照目录存在 */
function ensureSnapshotsDir(): void {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

/** 获取指定工程的快照文件路径 */
function getSnapshotPath(projectName: string): string {
  ensureSnapshotsDir();
  return path.join(SNAPSHOTS_DIR, `${projectName}.json`);
}

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
  ensureSnapshotsDir();

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
 * 将扫描到的实际文件与快照配置进行智能增量合并：
 * - 快照已有的条目：继承历史 triggerKey、lightType、position 等
 * - 新增的文件：
 *   - 路径含「背景/世界观/设定」→ constant（蓝灯）
 *   - 其余 → selective（绿灯），triggerKey 为文件名（不含扩展名）
 * - 废弃的文件（快照有但物理文件已删除）：自动剔除（不出现在结果中）
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
      // 继承快照配置
      const cfg = savedEntries[relPath];
      triggerKey = cfg.triggerKey ?? baseName;
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
      triggerKey,
      lightType,
      position,
      enabled,
      isNew,
    });
  }

  return { meta, entries: mergedList };
}
