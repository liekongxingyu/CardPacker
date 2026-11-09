import React from 'react';

interface ProjectSelectorProps {
  projects: string[];
  selected: string;
  onChange: (name: string) => void;
  loading: boolean;
  snapshotLastUpdated: string | null;
  onOpenWorkspaceModal?: () => void;
}

function formatSnapshotTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selected,
  onChange,
  loading,
  snapshotLastUpdated,
  onOpenWorkspaceModal,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Label & Select */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-lg shrink-0">
            📑
          </div>
          <div className="relative flex-1">
            <select
              value={selected}
              onChange={(e) => onChange(e.target.value)}
              disabled={loading || projects.length === 0}
              className="w-full bg-slate-50 hover:bg-slate-100/70 dark:bg-slate-900/80 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-800 dark:text-slate-100 appearance-none cursor-pointer focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {projects.length === 0 && (
                <option value="">当前目录未检测到有效工程</option>
              )}
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {/* Custom Arrow */}
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">
              ▼
            </span>
          </div>
        </div>

        {/* Right: Snapshot status & Change folder shortcut */}
        <div className="flex items-center gap-2 justify-end shrink-0">
          {projects.length === 0 && onOpenWorkspaceModal && (
            <button
              onClick={onOpenWorkspaceModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800 transition-colors cursor-pointer"
            >
              📁 更换扫描文件夹
            </button>
          )}

          {loading ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400">
              <svg
                className="animate-spin h-3.5 w-3.5 text-violet-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              正在扫描加载…
            </div>
          ) : selected ? (
            <div>
              {snapshotLastUpdated ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                  <span>💾</span>
                  <span>已保存 {formatSnapshotTime(snapshotLastUpdated)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                  <span>✨</span>
                  <span>新工程（未保存）</span>
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;
