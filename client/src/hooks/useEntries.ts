import { useState, useEffect, useCallback } from 'react';
import type { MergedEntry, LightType } from '../types';

const BACKGROUND_KEYWORDS = ['背景', '世界观', '设定'];

function smartLightType(entry: MergedEntry): LightType {
  const path = entry.relPath.toLowerCase();
  const hasKeyword = BACKGROUND_KEYWORDS.some((kw) => path.includes(kw));
  return hasKeyword ? 'constant' : 'selective';
}

export function useEntries(initialEntries: MergedEntry[]) {
  const [entries, setEntries] = useState<MergedEntry[]>(initialEntries);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset when initialEntries changes (project switch)
  useEffect(() => {
    setEntries(initialEntries);
    setSelectedIds(new Set());
  }, [initialEntries]);

  const toggleSelect = useCallback((relPath: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(relPath)) {
        next.delete(relPath);
      } else {
        next.add(relPath);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(entries.map((e) => e.relPath)));
  }, [entries]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const updateEntry = useCallback(
    (
      relPath: string,
      patch: Partial<Pick<MergedEntry, 'triggerKey' | 'lightType' | 'position' | 'enabled'>>
    ) => {
      setEntries((prev) =>
        prev.map((e) => (e.relPath === relPath ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const batchSetLight = useCallback(
    (lightType: LightType) => {
      setEntries((prev) =>
        prev.map((e) =>
          selectedIds.has(e.relPath) ? { ...e, lightType } : e
        )
      );
    },
    [selectedIds]
  );

  const smartReset = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (!selectedIds.has(e.relPath)) return e;
        const defaultKey = e.filename.replace(/\.[^/.]+$/, '');
        return {
          ...e,
          lightType: smartLightType(e),
          triggerKey: e.triggerKey?.trim() ? e.triggerKey : defaultKey,
        };
      })
    );
  }, [selectedIds]);

  return {
    entries,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    updateEntry,
    batchSetLight,
    smartReset,
  };
}
