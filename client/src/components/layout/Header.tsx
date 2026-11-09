import React from 'react';

interface HeaderProps {
  workspaceRoot: string;
  onOpenWorkspaceModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  workspaceRoot,
  onOpenWorkspaceModal,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 flex items-center justify-center text-xl shadow-xs">
            🎒
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-slate-900 dark:text-slate-50 font-bold text-base tracking-tight">
                CardPacker Pro
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
                SillyTavern V3
              </span>
            </div>
            <span className="text-slate-400 dark:text-slate-500 text-xs hidden md:block">
              角色卡工程规范快速打包与元数据配置
            </span>
          </div>
        </div>

        {/* Right: Workspace & Theme Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Workspace directory pill / button */}
          <button
            onClick={onOpenWorkspaceModal}
            title={`当前扫描路径: ${workspaceRoot}\n点击更换文件夹`}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer max-w-[200px] sm:max-w-xs md:max-w-md"
          >
            <span className="text-sm shrink-0">📂</span>
            <span className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
              {workspaceRoot || '未设置扫描文件夹'}
            </span>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-medium">
              更换
            </span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'light' ? '切换至深色模式' : '切换至浅色模式'}
            className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-sm"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
