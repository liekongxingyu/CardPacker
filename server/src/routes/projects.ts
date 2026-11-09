import { Router, Request, Response } from 'express';
import path from 'path';
import { getWorkspaceRoot } from '../config';
import { getCandidateProjects, scanProjectJsonFiles } from '../services/scanner';
import { loadSnapshot, saveSnapshot, mergeWithSnapshot } from '../services/snapshot';
import { buildTavernV3Card } from '../services/builder';
import {
  ApiResponse,
  ProjectDetail,
  SaveSnapshotRequest,
  ExportCardRequest,
} from '../types';

const router = Router();

/**
 * GET /api/projects
 * 返回工作区下所有可用工程文件夹名列表
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const projects = getCandidateProjects();
    const response: ApiResponse<string[]> = { success: true, data: projects };
    res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    res.status(500).json(response);
  }
});

/**
 * GET /api/projects/:name
 * 扫描指定工程目录并与快照合并，返回工程详情
 */
router.get('/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const projectDir = path.join(getWorkspaceRoot(), name);

    const scannedFiles = scanProjectJsonFiles(projectDir);
    const snapshot = loadSnapshot(name);
    const { meta, entries } = mergeWithSnapshot(scannedFiles, snapshot);

    const detail: ProjectDetail = {
      name,
      meta,
      entries,
      snapshotLastUpdated: snapshot.lastUpdated,
    };

    const response: ApiResponse<ProjectDetail> = { success: true, data: detail };
    res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    res.status(500).json(response);
  }
});

/**
 * POST /api/projects/:name/save
 * 保存快照
 */
router.post('/:name/save', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const body = req.body as SaveSnapshotRequest;

    if (!body.meta || !Array.isArray(body.entries)) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request body: meta and entries are required.',
      };
      return res.status(400).json(response);
    }

    const savedAt = saveSnapshot(name, body.meta, body.entries);
    const response: ApiResponse<{ savedAt: string }> = {
      success: true,
      data: { savedAt },
    };
    return res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/projects/:name/export
 * 保存快照，组装 V3 卡片，以文件流形式返回（触发浏览器另存为对话框）
 */
router.post('/:name/export', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const body = req.body as ExportCardRequest;

    if (!body.meta || !Array.isArray(body.entries)) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request body: meta and entries are required.',
      };
      return res.status(400).json(response);
    }

    // 1. 保存快照
    saveSnapshot(name, body.meta, body.entries);

    // 2. 重新扫描合并，获取 fullPath
    const projectDir = path.join(getWorkspaceRoot(), name);
    const scannedFiles = scanProjectJsonFiles(projectDir);
    const snapshot = loadSnapshot(name);
    const { meta, entries } = mergeWithSnapshot(scannedFiles, snapshot);

    // 3. 组装 V3 卡片
    const cardData = buildTavernV3Card(meta, entries);

    // 4. 序列化为 JSON 字符串
    const cardName = (cardData as { name?: string }).name ?? name;
    const filename = `${cardName}_Card_V3.json`;
    const content = JSON.stringify(cardData, null, 4);

    // 5. 以附件流形式返回，触发浏览器原生"另存为"
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    return res.send(content);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    return res.status(500).json(response);
  }
});

export default router;
