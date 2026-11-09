import React from 'react';
import type { MergedEntry, LightType, PositionType } from '../types';

interface EntryTableProps {
  entries: MergedEntry[];
  selectedIds: Set<string>;
  onChange: (entries: MergedEntry[]) => void;
  onToggleSelect: (relPath: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchSetLight: (lightType: LightType) => void;
  onSmartReset: () => void;
  onUpdateEntry: (
    relPath: string,
    patch: Partial<Pick<MergedEntry, 'triggerKey' | 'lightType' | 'position' | 'enabled'>>
  ) => void;
}

const POSITION_LABELS: Record<PositionType, string> = {
  before_char: '角色前 (Before Char)',
  after_char: '角色后 (After Char)',
  description: '描述区 (Description)',
};

function StatusBadge({ entry }: { entry: MergedEntry }) {
  if (!entry.isValid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        ⚠️ 错误
      </span>
    );
  }
  if (entry.isNew) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
        🆕 新增
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
      ✓ 正常
    </span>
  );
}

function LightBadge({
  value,
  onClick,
}: {
  value: LightType;
  onClick: () => void;
}) {
  if (value === 'constant') {
    return (
      <button
        onClick={onClick}
        title="点击切换为绿灯（触发词匹配）"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                   bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/80
                   hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
      >
        <span>🔵</span>
        <span>常驻 (蓝灯)</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title="点击切换为蓝灯（常驻生效）"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80
                 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
    >
      <span>🟢</span>
      <span>触发 (绿灯)</span>
    </button>
  );
}

const EntryTable: React.FC<EntryTableProps> = ({
  entries,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onBatchSetLight,
  onSmartReset,
  onUpdateEntry,
}) => {
  const allSelected = entries.length > 0 && selectedIds.size === entries.length;
  const someSelected = selectedIds.size > 0;

  const btnBase =
    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ';
  const btnGhost =
    btnBase +
    'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200';
  const btnBlue =
    btnBase +
    'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
  const btnGreen =
    btnBase +
    'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
  const btnPurple =
    btnBase +
    'bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300';

  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-900/40 flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
          条目批量操作
        </span>
        <button className={btnGhost} onClick={onSelectAll}>
          全选
        </button>
        <button className={btnGhost} onClick={onDeselectAll}>
          取消全选
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <button
          className={btnBlue}
          onClick={() => onBatchSetLight('constant')}
          disabled={!someSelected}
          title="批量设为蓝灯（常驻）"
        >
          🔵 批量蓝灯
        </button>
        <button
          className={btnGreen}
          onClick={() => onBatchSetLight('selective')}
          disabled={!someSelected}
          title="批量设为绿灯（触发）"
        >
          🟢 批量绿灯
        </button>
        <button
          className={btnPurple}
          onClick={onSmartReset}
          disabled={!someSelected}
          title="根据路径关键词自动判断灯型与触发词"
        >
          ✨ 智能推导重置
        </button>
        {someSelected && (
          <span className="ml-auto text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
            已选中 <span className="text-violet-600 dark:text-violet-400 font-bold">{selectedIds.size}</span> / {entries.length} 个条目
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight: '540px' }}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
            <tr className="border-b border-slate-200 dark:border-slate-700/80">
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={allSelected ? onDeselectAll : onSelectAll}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
              </th>
              <th className="w-12 px-2 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                #
              </th>
              <th className="w-24 px-2 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                状态
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                文件相对路径
              </th>
              <th className="w-48 px-2 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                触发关键词 (逗号分隔)
              </th>
              <th className="w-32 px-2 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                激活条件
              </th>
              <th className="w-36 px-2 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                注入位置
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📭</span>
                    <span>该工程文件夹内暂未找到任何 .json 条目文件</span>
                  </div>
                </td>
              </tr>
            )}
            {entries.map((entry, idx) => {
              const isSelected = selectedIds.has(entry.relPath);
              return (
                <tr
                  key={entry.relPath}
                  className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors
                    ${isSelected ? 'bg-violet-50/70 dark:bg-violet-950/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/20'}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(entry.relPath)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </td>
                  {/* Index */}
                  <td className="px-2 py-2.5 text-slate-400 dark:text-slate-500 text-xs font-mono">
                    {idx + 1}
                  </td>
                  {/* Status */}
                  <td className="px-2 py-2.5">
                    <StatusBadge entry={entry} />
                  </td>
                  {/* File path */}
                  <td className="px-2 py-2.5">
                    <span
                      className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all font-medium"
                      title={entry.fullPath}
                    >
                      {entry.relPath}
                    </span>
                    {entry.errorMsg && (
                      <p className="text-xs text-rose-500 mt-0.5">{entry.errorMsg}</p>
                    )}
                  </td>
                  {/* Trigger key */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={entry.triggerKey}
                      onChange={(e) =>
                        onUpdateEntry(entry.relPath, { triggerKey: e.target.value })
                      }
                      placeholder={entry.lightType === 'constant' ? '常驻无需触发词' : '关键词1, 关键词2…'}
                      disabled={entry.lightType === 'constant'}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-900/80 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 disabled:bg-slate-100/60 dark:disabled:bg-slate-800/40 disabled:text-slate-400 transition-all font-mono"
                    />
                  </td>
                  {/* Light type */}
                  <td className="px-2 py-2.5">
                    <LightBadge
                      value={entry.lightType}
                      onClick={() =>
                        onUpdateEntry(entry.relPath, {
                          lightType:
                            entry.lightType === 'constant' ? 'selective' : 'constant',
                        })
                      }
                    />
                  </td>
                  {/* Position */}
                  <td className="px-2 py-2.5">
                    <select
                      value={entry.position}
                      onChange={(e) =>
                        onUpdateEntry(entry.relPath, {
                          position: e.target.value as PositionType,
                        })
                      }
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 transition-all cursor-pointer font-medium"
                    >
                      {(Object.keys(POSITION_LABELS) as PositionType[]).map((pos) => (
                        <option key={pos} value={pos}>
                          {POSITION_LABELS[pos]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntryTable;
