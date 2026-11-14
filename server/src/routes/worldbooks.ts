import { Router, Request, Response } from 'express';
import path from 'path';
import { getWorkspaceRoot } from '../config';
import { getCandidateProjects, scanWorldbookFiles } from '../services/scanner';
import {
  loadWorldbookSnapshot,
  saveWorldbookSnapshot,
  mergeWorldbookWithSnapshot,
} from '../services/snapshot';
import { buildWorldbook } from '../services/builder';
import {
  ApiResponse,
  WorldbookDetail,
  SaveWorldbookRequest,
  ExportWorldbookRequest,
} from '../types';

const router = Router();

/**
 * GET /api/worldbooks
 * 返回世界书工作区下所有可用工程文件夹名列表
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const projects = getCandidateProjects('worldbook');
    const response: ApiResponse<string[]> = { success: true, data: projects };
    res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    res.status(500).json(response);
  }
});

/**
 * GET /api/worldbooks/:name
 * 扫描指定世界书工程目录并与快照合并，返回详情
 */
router.get('/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const projectDir = path.join(getWorkspaceRoot('worldbook'), name);

    const scannedFiles = scanWorldbookFiles(projectDir);
    const snapshot = loadWorldbookSnapshot(name);
    const { meta, entries } = mergeWorldbookWithSnapshot(scannedFiles, snapshot);

    const detail: WorldbookDetail = {
      name,
      meta,
      entries,
      snapshotLastUpdated: snapshot.lastUpdated,
    };

    const response: ApiResponse<WorldbookDetail> = { success: true, data: detail };
    res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    res.status(500).json(response);
  }
});

/**
 * POST /api/worldbooks/:name/save
 * 保存世界书快照
 */
router.post('/:name/save', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const body = req.body as SaveWorldbookRequest;

    if (!Array.isArray(body.entries)) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request body: entries is required.',
      };
      return res.status(400).json(response);
    }

    const savedAt = saveWorldbookSnapshot(name, body.meta, body.entries);
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
 * POST /api/worldbooks/:name/export
 * 保存快照，组装独立世界书 JSON，以附件流返回
 */
router.post('/:name/export', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const body = req.body as ExportWorldbookRequest;

    if (!Array.isArray(body.entries)) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request body: entries is required.',
      };
      return res.status(400).json(response);
    }

    // 1. 保存快照
    saveWorldbookSnapshot(name, body.meta, body.entries);

    // 2. 重新扫描合并，获取条目文件
    const projectDir = path.join(getWorkspaceRoot('worldbook'), name);
    const scannedFiles = scanWorldbookFiles(projectDir);
    const snapshot = loadWorldbookSnapshot(name);
    const { meta, entries } = mergeWorldbookWithSnapshot(scannedFiles, snapshot);

    // 覆盖用户自定义的世界书 meta
    const finalMeta = {
      ...meta,
      ...(body.meta || {}),
      name: body.meta?.name || meta.name || name,
    };

    // 3. 组装世界书
    const worldbookData = buildWorldbook(finalMeta, entries);

    // 4. 序列化为 JSON 字符串
    const filename = `${finalMeta.name}_Worldbook.json`;
    const content = JSON.stringify(worldbookData, null, 2);

    // 5. 以附件流形式返回
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

