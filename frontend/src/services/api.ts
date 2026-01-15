import type { ChatResponse, SessionInfo } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(
      error.error || 'Request failed',
      response.status,
      error.detail
    );
  }
  return response.json();
}

export const api = {
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse(response);
  },

  async createSession(name?: string): Promise<SessionInfo> {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  async listSessions(): Promise<{ sessions: SessionInfo[] }> {
    const response = await fetch(`${API_BASE}/sessions`);
    return handleResponse(response);
  },

  async getSession(sessionId: string): Promise<SessionInfo> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
    return handleResponse(response);
  },

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    return handleResponse(response);
  },

  async getTables(): Promise<{
    status: string;
    dataset: string;
    tables: Array<{
      name: string;
      full_name: string;
      description: string;
      num_rows: number;
      columns: Array<{ name: string; type: string; description: string }>;
    }>;
  }> {
    const response = await fetch(`${API_BASE}/schema/tables`);
    return handleResponse(response);
  },

  async getTableSchema(tableName: string): Promise<{
    status: string;
    table_name: string;
    columns: Array<{ name: string; type: string; description: string }>;
    sample_rows: Array<Record<string, unknown>>;
  }> {
    const response = await fetch(`${API_BASE}/schema/tables/${encodeURIComponent(tableName)}`);
    return handleResponse(response);
  },
};

export { ApiError };
