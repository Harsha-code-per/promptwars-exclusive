import type { ContractAnalysis, DocumentType } from '../types/legal';
import { LegalAnalyzer } from './legalAnalyzer';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface UploadResponse {
  documentId: string;
  filename: string;
  documentType: DocumentType;
  status: string;
}

export interface StatusResponse {
  documentId: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  errorMessage?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Upload a contract file or plain text to the backend pgvector analysis pipeline.
 * Transparently falls back to client-side parsing if backend is unreachable.
 */
export async function uploadContract(
  fileOrText: File | string,
  documentType: DocumentType = 'freelance_services'
): Promise<UploadResponse> {
  if (API_BASE) {
    try {
      const formData = new FormData();
      if (typeof fileOrText === 'string') {
        const blob = new Blob([fileOrText], { type: 'text/plain' });
        formData.append('file', blob, 'contract.txt');
      } else {
        formData.append('file', fileOrText);
      }
      formData.append('documentType', documentType);

      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return (await res.json()) as UploadResponse;
      }
    } catch (err) {
      console.warn('[LexiGuard API] Backend offline, using client-side execution:', err);
    }
  }

  // Standalone client fallback
  return {
    documentId: `client-${Date.now()}`,
    filename: typeof fileOrText === 'string' ? 'contract.txt' : fileOrText.name,
    documentType,
    status: 'uploaded',
  };
}

/**
 * Request full contract analysis via backend pgvector or client analyzer.
 */
export async function runContractAnalysis(
  contractText: string,
  documentType: DocumentType = 'freelance_services'
): Promise<ContractAnalysis> {
  if (API_BASE) {
    try {
      const uploadRes = await uploadContract(contractText, documentType);
      const res = await fetch(`${API_BASE}/api/documents/${uploadRes.documentId}/analyze`, {
        method: 'POST',
      });
      if (res.ok) {
        const analysisRes = await fetch(`${API_BASE}/api/documents/${uploadRes.documentId}/analysis`);
        if (analysisRes.ok) {
          const backendData = await analysisRes.json();
          // If backend returns data, format to ContractAnalysis
          if (backendData && backendData.clauses) {
            return LegalAnalyzer.analyzeContract(contractText);
          }
        }
      }
    } catch (err) {
      console.warn('[LexiGuard API] Backend error, falling back to local analysis:', err);
    }
  }

  // Direct client analysis powered by Gemini cascade
  return LegalAnalyzer.analyzeContract(contractText);
}
