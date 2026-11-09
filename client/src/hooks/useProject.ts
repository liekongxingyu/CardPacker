import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ProjectDetail, CardMeta } from '../types';

export function useProject() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.getProjects();
    if (res.success && res.data) {
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProject((prev) => (res.data!.includes(prev) ? prev : res.data![0]));
      } else {
        setSelectedProject('');
        setProjectDetail(null);
      }
    } else {
      setError(res.error ?? '无法加载工程列表');
      setProjects([]);
      setSelectedProject('');
      setProjectDetail(null);
    }
    setLoading(false);
  }, []);

  // Load project list on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load project detail when selected project changes
  useEffect(() => {
    if (!selectedProject) {
      setProjectDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      const res = await api.getProject(selectedProject);
      if (res.success && res.data) {
        setProjectDetail(res.data);
      } else {
        setError(res.error ?? '无法加载工程详情');
        setProjectDetail(null);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [selectedProject]);

  const selectProject = useCallback((name: string) => {
    setSelectedProject(name);
    setProjectDetail(null);
  }, []);

  const setMeta = useCallback((meta: CardMeta) => {
    setProjectDetail((prev) =>
      prev ? { ...prev, meta } : prev
    );
  }, []);

  const refreshDetail = useCallback(async () => {
    if (!selectedProject) return;
    const res = await api.getProject(selectedProject);
    if (res.success && res.data) {
      setProjectDetail(res.data);
    }
  }, [selectedProject]);

  const applyNewWorkspaceProjects = useCallback((newProjects: string[]) => {
    setProjects(newProjects);
    if (newProjects.length > 0) {
      setSelectedProject(newProjects[0]);
    } else {
      setSelectedProject('');
      setProjectDetail(null);
    }
  }, []);

  return {
    projects,
    selectedProject,
    projectDetail,
    loading,
    error,
    selectProject,
    setMeta,
    refreshDetail,
    fetchProjects,
    applyNewWorkspaceProjects,
  };
}
