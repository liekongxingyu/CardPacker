import { Router, Request, Response } from 'express';
import fs from 'fs';
import { exec } from 'child_process';
import {
  getWorkspaceRoot,
  setWorkspaceRoot,
  resetWorkspaceRoot,
  DEFAULT_WORKSPACE_ROOT,
  DEFAULT_WORLDBOOK_WORKSPACE_ROOT,
} from '../config';
import { getCandidateProjects } from '../services/scanner';
import { ApiResponse, AppMode } from '../types';

const router = Router();

export interface ConfigData {
  workspaceRoot: string;
  defaultWorkspaceRoot: string;
  worldbookWorkspaceRoot: string;
  defaultWorldbookWorkspaceRoot: string;
  exists: boolean;
  projects: string[];
}

function parseMode(req: Request): AppMode {
  const mode = (req.query.mode || req.body?.mode) as string | undefined;
  return mode === 'worldbook' ? 'worldbook' : 'character';
}

/**
 * GET /api/config
 * 返回当前工作区路径配置及工程列表，支持通过 ?mode=worldbook 或 ?mode=character 查询
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const mode = parseMode(req);
    const charRoot = getWorkspaceRoot('character');
    const wbRoot = getWorkspaceRoot('worldbook');
    const activeRoot = getWorkspaceRoot(mode);
    const exists = fs.existsSync(activeRoot);
    const projects = exists ? getCandidateProjects(mode) : [];

    const response: ApiResponse<ConfigData> = {
      success: true,
      data: {
        workspaceRoot: charRoot,
        defaultWorkspaceRoot: DEFAULT_WORKSPACE_ROOT,
        worldbookWorkspaceRoot: wbRoot,
        defaultWorldbookWorkspaceRoot: DEFAULT_WORLDBOOK_WORKSPACE_ROOT,
        exists,
        projects,
      },
    };
    res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const response: ApiResponse<never> = { success: false, error: msg };
    res.status(500).json(response);
  }
});

/**
 * POST /api/config/workspace
 * 切换扫描根目录（支持指定 mode）
 */
router.post('/workspace', (req: Request, res: Response) => {
  try {
    const { path: newPath, mode: rawMode } = req.body as { path?: string; mode?: AppMode };
    const mode: AppMode = rawMode === 'worldbook' ? 'worldbook' : 'character';

    if (!newPath || typeof newPath !== 'string' || !newPath.trim()) {
      return res.status(400).json({
        success: false,
        error: '目录路径不能为空',
      });
    }

    const trimmedPath = newPath.trim();

    if (!fs.existsSync(trimmedPath)) {
      return res.status(400).json({
        success: false,
        error: `指定的文件夹不存在: ${trimmedPath}`,
      });
    }

    const stat = fs.statSync(trimmedPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: `指定的路径不是一个文件夹: ${trimmedPath}`,
      });
    }

    setWorkspaceRoot(trimmedPath, mode);
    const projects = getCandidateProjects(mode);

    const response: ApiResponse<ConfigData> = {
      success: true,
      data: {
        workspaceRoot: getWorkspaceRoot('character'),
        defaultWorkspaceRoot: DEFAULT_WORKSPACE_ROOT,
        worldbookWorkspaceRoot: getWorkspaceRoot('worldbook'),
        defaultWorldbookWorkspaceRoot: DEFAULT_WORLDBOOK_WORKSPACE_ROOT,
        exists: true,
        projects,
      },
    };
    return res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/config/reset-workspace
 * 重置回默认工作区根目录
 */
router.post('/reset-workspace', (req: Request, res: Response) => {
  try {
    const mode = parseMode(req);
    resetWorkspaceRoot(mode);
    const activeRoot = getWorkspaceRoot(mode);
    const exists = fs.existsSync(activeRoot);
    const projects = exists ? getCandidateProjects(mode) : [];

    const response: ApiResponse<ConfigData> = {
      success: true,
      data: {
        workspaceRoot: getWorkspaceRoot('character'),
        defaultWorkspaceRoot: DEFAULT_WORKSPACE_ROOT,
        worldbookWorkspaceRoot: getWorkspaceRoot('worldbook'),
        defaultWorldbookWorkspaceRoot: DEFAULT_WORLDBOOK_WORKSPACE_ROOT,
        exists,
        projects,
      },
    };
    res.json(response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/config/browse
 * 唤起系统文件夹选择器（支持 Windows）
 */
router.post('/browse', (req: Request, res: Response) => {
  if (process.platform !== 'win32') {
    return res.status(400).json({
      success: false,
      error: '系统文件夹选择对话框仅支持 Windows 系统',
    });
  }

  const mode = parseMode(req);
  const currentRoot = getWorkspaceRoot(mode);
  const initialPath = fs.existsSync(currentRoot) ? currentRoot : '';
  const desc = mode === 'worldbook' ? '请选择世界书工程扫描根目录' : '请选择角色卡工程扫描根目录';

  const psScript = `
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = '${desc}'
$dialog.ShowNewFolderButton = $true
if ('${initialPath.replace(/'/g, "''")}' -ne '') {
    $dialog.SelectedPath = '${initialPath.replace(/'/g, "''")}'
}
$topForm = New-Object System.Windows.Forms.Form
$topForm.TopMost = $true
$result = $dialog.ShowDialog($topForm)
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
} else {
    Write-Output "__CANCEL__"
}
`;

  const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

  exec(
    `powershell -NoProfile -EncodedCommand ${encoded}`,
    { encoding: 'utf-8', timeout: 60000 },
    (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: stderr || err.message,
        });
      }

      const result = stdout.trim();
      if (!result || result === '__CANCEL__') {
        return res.json({
          success: true,
          data: { canceled: true },
        });
      }

      return res.json({
        success: true,
        data: { canceled: false, selectedPath: result },
      });
    }
  );
});

export default router;
