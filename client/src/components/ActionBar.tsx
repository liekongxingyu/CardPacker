import React from 'react';
import type { AppMode } from '../types';

interface ActionBarProps {
  totalEntries: number;
  enabledEntries: number;
  onSave: () => void;
  onExport: () => void;
  saving: boolean;
  exporting: boolean;
  mode?: AppMode;
}

const ActionBar: React.FC<ActionBarProps> = ({
  totalEntries,
  enabledEntries,
  onSave,
  onExport,
  saving,
  exporting,
  mode = 'character',
}) => {
  const isWorldbook = mode === 'worldbook';

  return (
    <div className="sticky bottom-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: stats */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>
            扫描条目总计{' '}
            <span className="text-slate-900 dark:text-slate-100 font-bold">{totalEntries}</span>
          </span>
          <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
          <span>
            已就绪条目{' '}
            <span
              className={`font-bold ${
                isWorldbook
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-violet-600 dark:text-violet-400'
              }`}
            >
              {enabledEntries}
            </span>
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                       bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
                       border border-slate-300/80 dark:border-slate-600 text-slate-800 dark:text-slate-100
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all cursor-pointer shadow-xs"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>保存中…</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>保存快照</span>
              </>
            )}
          </button>

          <button
            onClick={onExport}
            disabled={exporting}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md transition-all cursor-pointer ${
                         isWorldbook
                           ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                           : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25'
                       }`}
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>打包生成中…</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>{isWorldbook ? '导出世界书' : '导出 V3 卡片'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
