import type {
  ApiResponse,
  ProjectDetail,
  SaveSnapshotRequest,
  ExportCardRequest,
  ConfigData,
} from '../types';

const BASE_URL = '';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * 触发浏览器文件下载（另存为对话框）
 * 返回 true 表示成功，false 表示请求失败
 */
async function downloadFile(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!res.ok) {
      const json = (await res.json()) as ApiResponse<never>;
      return { success: false, error: json.error ?? `HTTP ${res.status}` };
    }

    const disposition = res.headers.get('Content-Disposition') ?? '';
    const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/i);
    const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
    const filename = utf8Match
      ? decodeURIComponent(utf8Match[1])
      : plainMatch
      ? plainMatch[1]
      : 'card.json';

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export const api = {
  getProjects(): Promise<ApiResponse<string[]>> {
    return request<string[]>('/api/projects');
  },

  getProject(name: string): Promise<ApiResponse<ProjectDetail>> {
    return request<ProjectDetail>(`/api/projects/${encodeURIComponent(name)}`);
  },

  saveSnapshot(
    name: string,
    body: SaveSnapshotRequest
  ): Promise<ApiResponse<{ savedAt: string }>> {
    return request<{ savedAt: string }>(
      `/api/projects/${encodeURIComponent(name)}/save`,
      { method: 'POST', body: JSON.stringify(body) }
    );
  },

  exportCard(
    name: string,
    body: ExportCardRequest
  ): Promise<{ success: boolean; error?: string }> {
    return downloadFile(
      `/api/projects/${encodeURIComponent(name)}/export`,
      { method: 'POST', body: JSON.stringify(body) }
    );
  },

  getConfig(): Promise<ApiResponse<ConfigData>> {
    return request<ConfigData>('/api/config');
  },

  setWorkspace(path: string): Promise<ApiResponse<ConfigData>> {
    return request<ConfigData>('/api/config/workspace', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  },

  resetWorkspace(): Promise<ApiResponse<ConfigData>> {
    return request<ConfigData>('/api/config/reset-workspace', {
      method: 'POST',
    });
  },

  browseWorkspace(): Promise<ApiResponse<{ canceled?: boolean; selectedPath?: string }>> {
    return request<{ canceled?: boolean; selectedPath?: string }>('/api/config/browse', {
      method: 'POST',
    });
  },
};
