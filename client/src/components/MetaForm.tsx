import React from 'react';
import type { CardMeta } from '../types';

interface MetaFormProps {
  meta: CardMeta;
  onChange: (meta: CardMeta) => void;
}

const inputClass =
  'w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white dark:bg-slate-900/80 dark:focus:bg-slate-900 ' +
  'border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 ' +
  'placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all';

const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

const MetaForm: React.FC<MetaFormProps> = ({ meta, onChange }) => {
  const set =
    <K extends keyof CardMeta>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...meta, [key]: e.target.value });

  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="text-base">📇</span>
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            角色卡基础信息
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          导出时将写入 SillyTavern V3 规范元字段
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>角色卡名称 (Name)</label>
            <input
              type="text"
              value={meta.cardName}
              onChange={set('cardName')}
              placeholder="例如: 艾莲·乔 (Ellen Joe)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>标签分类 (Tags，逗号分隔)</label>
            <input
              type="text"
              value={meta.tags}
              onChange={set('tags')}
              placeholder="例如: 角色卡, 绝区零, 傲娇, 维多利亚家政"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>制作者 (Creator)</label>
              <input
                type="text"
                value={meta.creator}
                onChange={set('creator')}
                placeholder="制作者名"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>工程版本 (Version)</label>
              <input
                type="text"
                value={meta.characterVersion}
                onChange={set('characterVersion')}
                placeholder="1.0.0"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>角色简介与设定 (Description)</label>
            <textarea
              value={meta.cardDescription}
              onChange={set('cardDescription')}
              placeholder="角色的核心性格、外貌特征、世界观背景…"
              rows={4}
              className={`${inputClass} resize-none leading-relaxed font-sans`}
            />
          </div>
          <div>
            <label className={labelClass}>首条对话 / 开场白 (First Message)</label>
            <textarea
              value={meta.firstMes}
              onChange={set('firstMes')}
              placeholder="对话开始时的场景描写或角色第一句问候台词…"
              rows={3}
              className={`${inputClass} resize-none leading-relaxed font-sans`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaForm;
