import React from 'react';
import type { WorldbookMeta } from '../types';

interface WorldbookMetaBarProps {
  meta: WorldbookMeta;
  onChange: (meta: WorldbookMeta) => void;
}

const inputClass =
  'w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white dark:bg-slate-900/80 dark:focus:bg-slate-900 ' +
  'border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 ' +
  'placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all';

const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

const WorldbookMetaBar: React.FC<WorldbookMetaBarProps> = ({ meta, onChange }) => {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="text-base">📖</span>
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            世界书基础信息
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          独立 Lorebook 规范（无角色卡描述）
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>世界书名称 (Worldbook Name)</label>
          <input
            type="text"
            value={meta.name}
            onChange={(e) => onChange({ ...meta, name: e.target.value })}
            placeholder="世界书名称，默认使用文件夹名"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>世界书简介 / 备注 (可选 Description)</label>
          <input
            type="text"
            value={meta.description || ''}
            onChange={(e) => onChange({ ...meta, description: e.target.value })}
            placeholder="例如: 艾莲乔专属世界书 / 新艾利都城市设定集"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default WorldbookMetaBar;

