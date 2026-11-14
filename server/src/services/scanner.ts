import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { XMLValidator } from 'fast-xml-parser';
import { ScannedFile, AppMode } from '../types';
import { getWorkspaceRoot, EXCLUDED_DIRS } from '../config';

/**
 * 扫描当前工作区根目录，返回所有可用工程文件夹名列表
 */
export function getCandidateProjects(mode: AppMode = 'character'): string[] {
  const root = getWorkspaceRoot(mode);
  if (!fs.existsSync(root)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    const projects: string[] = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      projects.push(entry.name);
    }

    return projects;
  } catch (err) {
    console.error(`[Scanner] 扫描目录失败: ${root}`, err);
    return [];
  }
}

/**
 * 递归扫描指定角色卡工程目录下所有 .json 文件（排除 _Card_V3.json 结尾的文件）
 * 对每个文件尝试 JSON.parse 校验有效性
 */
export function scanProjectJsonFiles(projectDir: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  if (!fs.existsSync(projectDir)) {
    return results;
  }

  function walk(dir: string): void {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      console.warn(`[Scanner] 无法读取目录: ${dir}`, e);
      return;
    }

    // 保证扫描顺序一致
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !entry.name.endsWith('_Card_V3.json') &&
        !entry.name.startsWith('.')
      ) {
        // 相对路径，统一使用正斜杠
        const relPath = path
          .relative(projectDir, fullPath)
          .replace(/\\/g, '/');

        let isValid = true;
        let errorMsg: string | null = null;

        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          JSON.parse(content);
        } catch (e: unknown) {
          isValid = false;
          errorMsg = e instanceof Error ? e.message : String(e);
        }

        results.push({
          filename: entry.name,
          relPath,
          fullPath,
          isValid,
          errorMsg,
          fileType: 'json',
        });
      }
    }
  }

  walk(projectDir);
  return results;
}

const WORLDBOOK_SUPPORTED_EXTS = new Set([
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.txt',
  '.md',
]);

/**
 * 递归扫描世界书工程目录下所有条目文件（支持 .json, .yaml, .yml, .xml, .txt, .md）
 * 排除 _Worldbook.json, _Card_V3.json 及隐藏文件
 */
export function scanWorldbookFiles(projectDir: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  if (!fs.existsSync(projectDir)) {
    return results;
  }

  function walk(dir: string): void {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      console.warn(`[Scanner] 无法读取世界书目录: ${dir}`, e);
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        if (entry.name.startsWith('.')) continue;
        if (entry.name.endsWith('_Worldbook.json') || entry.name.endsWith('_Card_V3.json')) {
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (!WORLDBOOK_SUPPORTED_EXTS.has(ext)) {
          continue;
        }

        const relPath = path
          .relative(projectDir, fullPath)
          .replace(/\\/g, '/');

        let isValid = true;
        let errorMsg: string | null = null;
        let fileType: 'json' | 'yaml' | 'xml' | 'text' = 'text';

        try {
          const content = fs.readFileSync(fullPath, 'utf-8');

          if (ext === '.json') {
            fileType = 'json';
            JSON.parse(content);
          } else if (ext === '.yaml' || ext === '.yml') {
            fileType = 'yaml';
            YAML.parse(content);
          } else if (ext === '.xml') {
            fileType = 'xml';
            const validationResult = XMLValidator.validate(content);
            if (validationResult !== true) {
              isValid = false;
              errorMsg = validationResult.err.msg;
            }
          } else {
            fileType = 'text';
          }
        } catch (e: unknown) {
          isValid = false;
          errorMsg = e instanceof Error ? e.message : String(e);
        }

        results.push({
          filename: entry.name,
          relPath,
          fullPath,
          isValid,
          errorMsg,
          fileType,
        });
      }
    }
  }

  walk(projectDir);
  return results;
}
