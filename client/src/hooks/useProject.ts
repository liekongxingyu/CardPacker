import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ProjectDetail, WorldbookDetail, CardMeta, WorldbookMeta, AppMode } from '../types';

export function useProject(mode: AppMode = 'character') {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [worldbookDetail, setWorldbookDetail] = useState<WorldbookDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res =
      mode === 'worldbook' ? await api.getWorldbooks() : await api.getProjects();

    if (res.success && res.data) {
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProject((prev) => (res.data!.includes(prev) ? prev : res.data![0]));
      } else {
        setSelectedProject('');
        setProjectDetail(null);
        setWorldbookDetail(null);
      }
    } else {
      setError(res.error ?? (mode === 'worldbook' ? '无法加载世界书列表' : '无法加载工程列表'));
      setProjects([]);
      setSelectedProject('');
      setProjectDetail(null);
      setWorldbookDetail(null);
    }
    setLoading(false);
  }, [mode]);

  // Load project list on mount or when mode changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load project detail when selected project or mode changes
  useEffect(() => {
    if (!selectedProject) {
      setProjectDetail(null);
      setWorldbookDetail(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      if (mode === 'worldbook') {
        const res = await api.getWorldbook(selectedProject);
        if (!isMounted) return;
        if (res.success && res.data) {
          setWorldbookDetail(res.data);
          setProjectDetail(null);
        } else {
          setError(res.error ?? '无法加载世界书详情');
          setWorldbookDetail(null);
        }
      } else {
        const res = await api.getProject(selectedProject);
        if (!isMounted) return;
        if (res.success && res.data) {
          setProjectDetail(res.data);
          setWorldbookDetail(null);
        } else {
          setError(res.error ?? '无法加载工程详情');
          setProjectDetail(null);
        }
      }
      setLoading(false);
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedProject, mode]);

  const selectProject = useCallback((name: string) => {
    setSelectedProject(name);
    setProjectDetail(null);
    setWorldbookDetail(null);
  }, []);

  const setMeta = useCallback((meta: CardMeta) => {
    setProjectDetail((prev) => (prev ? { ...prev, meta } : prev));
  }, []);

  const setWorldbookMeta = useCallback((meta: WorldbookMeta) => {
    setWorldbookDetail((prev) => (prev ? { ...prev, meta } : prev));
  }, []);

  const refreshDetail = useCallback(async () => {
    if (!selectedProject) return;
    if (mode === 'worldbook') {
      const res = await api.getWorldbook(selectedProject);
      if (res.success && res.data) {
        setWorldbookDetail(res.data);
      }
    } else {
      const res = await api.getProject(selectedProject);
      if (res.success && res.data) {
        setProjectDetail(res.data);
      }
    }
  }, [selectedProject, mode]);

  const applyNewWorkspaceProjects = useCallback((newProjects: string[]) => {
    setProjects(newProjects);
    if (newProjects.length > 0) {
      setSelectedProject(newProjects[0]);
    } else {
      setSelectedProject('');
      setProjectDetail(null);
      setWorldbookDetail(null);
    }
  }, []);

  const currentEntries =
    mode === 'worldbook'
      ? worldbookDetail?.entries ?? []
      : projectDetail?.entries ?? [];

  const snapshotLastUpdated =
    mode === 'worldbook'
      ? worldbookDetail?.snapshotLastUpdated ?? null
      : projectDetail?.snapshotLastUpdated ?? null;

  return {
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
    fetchProjects,
    applyNewWorkspaceProjects,
  };
}
