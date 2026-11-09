import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  defaultPath: string;
  onWorkspaceChanged: (newPath: string, newProjects: string[]) => void;
  onNotify: (kind: 'success' | 'error', message: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentPath,
  defaultPath,
  onWorkspaceChanged,
  onNotify,
}) => {
  const [inputPath, setInputPath] = useState(currentPath);
  const [submitting, setSubmitting] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputPath(currentPath);
      setLocalError(null);
    }
  }, [isOpen, currentPath]);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    setBrowsing(true);
    setLocalError(null);
    try {
      const res = await api.browseWorkspace();
      if (res.success && res.data) {
        if (!res.data.canceled && res.data.selectedPath) {
          setInputPath(res.data.selectedPath);
        }
      } else if (res.error) {
        setLocalError(res.error);
      }
    } catch (e) {
      setLocalError(String(e));
    } finally {
      setBrowsing(false);
    }
  };

  const handleResetToDefault = () => {
    setInputPath(defaultPath);
    setLocalError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPath.trim()) {
      setLocalError('请输入或选择有效的文件夹路径');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    const res = await api.setWorkspace(inputPath.trim());
    setSubmitting(false);

    if (res.success && res.data) {
      onWorkspaceChanged(res.data.workspaceRoot, res.data.projects);
      onNotify('success', `扫描文件夹已切换！发现 ${res.data.projects.length} 个工程`);
      onClose();
    } else {
      setLocalError(res.error ?? '切换扫描文件夹失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📁</span>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                更改角色卡扫描文件夹
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                程序将扫描此目录下的子文件夹作为可用工程
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              目标文件夹物理路径
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputPath}
                onChange={(e) => {
                  setInputPath(e.target.value);
                  setLocalError(null);
                }}
                placeholder="例如: D:\Cards 或 D:\BaiduSyncdisk\文件\个人\世界书"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                autoFocus
              />
            </div>
            {localError && (
              <p className="mt-2 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
                ⚠️ {localError}
              </p>
            )}
          </div>

          {/* Quick Helper Actions */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleBrowse}
              disabled={browsing || submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {browsing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  等待系统选择…
                </>
              ) : (
                <>🖥️ 系统文件浏览窗口</>
              )}
            </button>

            {defaultPath && inputPath !== defaultPath && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                🔄 填入初始默认目录
              </button>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
            <p>💡 <span className="font-medium text-slate-700 dark:text-slate-300">提示：</span></p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 dark:text-slate-400">
              <li>默认初始路径为：<code className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{defaultPath}</code></li>
              <li>切换后配置将自动持久化，下次启动程序依然有效。</li>
              <li>系统将自动排除 <code className="font-mono">.git</code>, <code className="font-mono">node_modules</code> 等非工程目录。</li>
            </ul>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 shadow-md shadow-violet-500/20 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  切换中…
                </>
              ) : (
                <>确认切换</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceModal;
