import type {
  UploadResponse,
  StatusResponse,
  AnalyzeResponse,
  AnalysisResult,
  GotchasResponse,
  DocumentType,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchWithRetry(url: string, options?: RequestInit, retries: number = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        console.warn(`[api] Fetch failed, retrying in 1s (${attempt + 1}/${retries})...`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError || new Error('Network error: unable to connect to server. Please check if the backend is running.');
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new ApiError(response.status, body.error?.message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Upload a contract document */
export async function uploadDocument(
  file: File,
  documentType: DocumentType
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await fetchWithRetry(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

/** Check document processing status */
export async function getDocumentStatus(documentId: string): Promise<StatusResponse> {
  const response = await fetchWithRetry(`${API_BASE}/documents/${documentId}/status`);
  return handleResponse<StatusResponse>(response);
}

/** Trigger analysis pipeline */
export async function analyzeDocument(documentId: string): Promise<AnalyzeResponse> {
  const response = await fetchWithRetry(`${API_BASE}/documents/${documentId}/analyze`, {
    method: 'POST',
  });
  return handleResponse<AnalyzeResponse>(response);
}

/** Get full analysis results */
export async function getAnalysis(documentId: string): Promise<AnalysisResult> {
  const response = await fetchWithRetry(`${API_BASE}/documents/${documentId}/analysis`);
  return handleResponse<AnalysisResult>(response);
}

/** Get gotchas summary */
export async function getGotchas(documentId: string): Promise<GotchasResponse> {
  const response = await fetchWithRetry(`${API_BASE}/documents/${documentId}/gotchas`);
  return handleResponse<GotchasResponse>(response);
}

export { ApiError };
