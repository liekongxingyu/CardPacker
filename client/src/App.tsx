import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/layout/Header';
import ProjectSelector from './components/ProjectSelector';
import MetaForm from './components/MetaForm';
import WorldbookMetaBar from './components/WorldbookMetaBar';
import EntryTable from './components/EntryTable';
import ActionBar from './components/ActionBar';
import WorkspaceModal from './components/WorkspaceModal';
import { useProject } from './hooks/useProject';
import { useEntries } from './hooks/useEntries';
import { api } from './api';
import type { MergedEntry, AppMode } from './types';

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let toastIdCounter = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border backdrop-blur-md transition-all
            ${
              t.kind === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
        >
          {t.kind === 'success' ? '✅' : '❌'} {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  // App Mode: character or worldbook
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('cardpacker_mode');
    return saved === 'worldbook' ? 'worldbook' : 'character';
  });

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem('cardpacker_mode', newMode);
  }, []);

  const {
    projects,
    selectedProject,
    projectDetail,
    worldbookDetail,
    currentEntries,
    snapshotLastUpdated,
    loading,
    error,
    selectProject,
    setMeta,
    setWorldbookMeta,
    refreshDetail,
    applyNewWorkspaceProjects,
  } = useProject(mode);

  const {
    entries,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    updateEntry,
    batchSetLight,
    smartReset,
  } = useEntries(currentEntries);

  const [workspaceRoot, setWorkspaceRoot] = useState('');
  const [defaultWorkspaceRoot, setDefaultWorkspaceRoot] = useState('');
  const [worldbookWorkspaceRoot, setWorldbookWorkspaceRoot] = useState('');
  const [defaultWorldbookWorkspaceRoot, setDefaultWorldbookWorkspaceRoot] = useState('');
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Theme management: default to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cardpacker_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('cardpacker_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Load workspace config
  const reloadConfig = useCallback(() => {
    api.getConfig(mode).then((res) => {
      if (res.success && res.data) {
        setWorkspaceRoot(res.data.workspaceRoot);
        setDefaultWorkspaceRoot(res.data.defaultWorkspaceRoot);
        setWorldbookWorkspaceRoot(res.data.worldbookWorkspaceRoot);
        setDefaultWorldbookWorkspaceRoot(res.data.defaultWorldbookWorkspaceRoot);
      }
    });
  }, [mode]);

  useEffect(() => {
    reloadConfig();
  }, [reloadConfig]);

  const activeWorkspaceRoot =
    mode === 'worldbook' ? worldbookWorkspaceRoot : workspaceRoot;
  const activeDefaultWorkspaceRoot =
    mode === 'worldbook' ? defaultWorldbookWorkspaceRoot : defaultWorkspaceRoot;

  const handleWorkspaceChanged = useCallback(
    (newPath: string, newProjects: string[]) => {
      if (mode === 'worldbook') {
        setWorldbookWorkspaceRoot(newPath);
      } else {
        setWorkspaceRoot(newPath);
      }
      applyNewWorkspaceProjects(newProjects);
    },
    [mode, applyNewWorkspaceProjects]
  );

  const entriesPayload = useMemo(() => {
    return entries.map((e) => ({
      relPath: e.relPath,
      triggerKey: e.triggerKey,
      lightType: e.lightType,
      position: e.position,
      enabled: e.enabled,
    }));
  }, [entries]);

  const handleSave = useCallback(async () => {
    if (!selectedProject) return;
    setSaving(true);

    if (mode === 'worldbook') {
      if (!worldbookDetail) {
        setSaving(false);
        return;
      }
      const res = await api.saveWorldbook(selectedProject, {
        meta: worldbookDetail.meta,
        entries: entriesPayload,
      });
      setSaving(false);
      if (res.success) {
        pushToast('success', '世界书快照已成功保存！');
        refreshDetail();
      } else {
        pushToast('error', res.error ?? '保存失败');
      }
    } else {
      if (!projectDetail) {
        setSaving(false);
        return;
      }
      const res = await api.saveSnapshot(selectedProject, {
        meta: projectDetail.meta,
        entries: entriesPayload,
      });
      setSaving(false);
      if (res.success) {
        pushToast('success', '角色卡工程快照已成功保存！');
        refreshDetail();
      } else {
        pushToast('error', res.error ?? '保存失败');
      }
    }
  }, [
    mode,
    selectedProject,
    worldbookDetail,
    projectDetail,
    entriesPayload,
    pushToast,
    refreshDetail,
  ]);

  const handleExport = useCallback(async () => {
    if (!selectedProject) return;
    setExporting(true);

    if (mode === 'worldbook') {
      if (!worldbookDetail) {
        setExporting(false);
        return;
      }
      const res = await api.exportWorldbook(selectedProject, {
        meta: worldbookDetail.meta,
        entries: entriesPayload,
      });
      setExporting(false);
      if (res.success) {
        pushToast('success', '导出成功！已唤起世界书 JSON 下载');
      } else {
        pushToast('error', res.error ?? '导出失败');
      }
    } else {
      if (!projectDetail) {
        setExporting(false);
        return;
      }
      const res = await api.exportCard(selectedProject, {
        meta: projectDetail.meta,
        entries: entriesPayload,
      });
      setExporting(false);
      if (res.success) {
        pushToast('success', '导出成功！已唤起角色卡文件下载');
      } else {
        pushToast('error', res.error ?? '导出失败');
      }
    }
  }, [
    mode,
    selectedProject,
    worldbookDetail,
    projectDetail,
    entriesPayload,
    pushToast,
  ]);

  const handleEntriesChange = useCallback(
    (_updated: MergedEntry[]) => {
      // Handled internally by useEntries
    },
    []
  );

  const enabledCount = entries.filter((e) => e.enabled).length;
  const isWorldbook = mode === 'worldbook';
  const hasActiveDetail = isWorldbook ? !!worldbookDetail : !!projectDetail;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <ToastContainer toasts={toasts} />

      <Header
        mode={mode}
        onModeChange={handleModeChange}
        workspaceRoot={activeWorkspaceRoot}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        currentPath={activeWorkspaceRoot}
        defaultPath={activeDefaultWorkspaceRoot}
        onWorkspaceChanged={handleWorkspaceChanged}
        onNotify={pushToast}
        mode={mode}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 pb-28 space-y-4.5">
        {/* Project selector */}
        <ProjectSelector
          projects={projects}
          selected={selectedProject}
          onChange={selectProject}
          loading={loading}
          snapshotLastUpdated={snapshotLastUpdated}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
          mode={mode}
        />

        {/* Error state */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>❌</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="text-xs font-semibold text-rose-800 dark:text-rose-200 underline hover:no-underline cursor-pointer"
            >
              更改扫描路径
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !hasActiveDetail && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
            <div className="h-36 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        )}

        {/* Main content when project is loaded */}
        {hasActiveDetail && (
          <>
            {/* In Character mode: show MetaForm. In Worldbook mode: show minimal WorldbookMetaBar (no character description) */}
            {!isWorldbook && projectDetail && (
              <MetaForm meta={projectDetail.meta} onChange={setMeta} />
            )}

            {isWorldbook && worldbookDetail && (
              <WorldbookMetaBar
                meta={worldbookDetail.meta}
                onChange={setWorldbookMeta}
              />
            )}

            <EntryTable
              entries={entries}
              selectedIds={selectedIds}
              onChange={handleEntriesChange}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onBatchSetLight={batchSetLight}
              onSmartReset={smartReset}
              onUpdateEntry={updateEntry}
            />
          </>
        )}

        {/* Empty state: No projects in folder */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 space-y-4 shadow-xs">
            <div className="text-5xl">{isWorldbook ? '📖' : '📁'}</div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                当前扫描目录下未发现{isWorldbook ? '世界书' : '工程'}文件夹
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                当前扫描路径为{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                  {activeWorkspaceRoot}
                </code>
                ，该目录下暂无符合条件的{isWorldbook ? '世界书' : '角色卡'}文件夹。
              </p>
            </div>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                isWorldbook
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                  : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25'
              }`}
            >
              📂 更改或选择扫描文件夹
            </button>
          </div>
        )}

        {/* Empty state: Has projects, but none selected */}
        {!loading && !error && !hasActiveDetail && projects.length > 0 && !selectedProject && (
          <div className="text-center py-24 text-slate-400 dark:text-slate-500">
            <p className="text-5xl mb-3">{isWorldbook ? '📖' : '📂'}</p>
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              请在上方选择一个{isWorldbook ? '世界书' : '工程'}以开始编辑与打包
            </p>
          </div>
        )}
      </main>

      <ActionBar
        totalEntries={entries.length}
        enabledEntries={enabledCount}
        onSave={handleSave}
        onExport={handleExport}
        saving={saving}
        exporting={exporting}
        mode={mode}
      />
    </div>
  );
}

export default App;
