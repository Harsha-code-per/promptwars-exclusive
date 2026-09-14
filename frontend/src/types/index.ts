/** Document types supported by Fenco */
export type DocumentType = 'freelance_services' | 'residential_lease';

/** Risk classification for scored clauses */
export type RiskLevel = 'Standard' | 'Caution' | 'Unfavorable';

/** Document processing status */
export type DocumentStatus = 'uploaded' | 'processing' | 'analyzed' | 'error';

/** Scored clause from the API */
export interface ScoredClause {
  id: string;
  documentId: string;
  clauseType: string;
  clauseText: string;
  clauseIndex: number;
  contentHash: string;
  riskLevel: RiskLevel;
  similarityScore: number;
  nearestBenchmarkId: string | null;
  nearestBenchmarkText: string | null;
  semanticDeltaExplanation: string | null;
  counterDraft: string | null;
  counterDraftExplanation: string | null;
}

/** A gotcha item from the summary */
export interface GotchaItem {
  title: string;
  explanation: string;
  riskLevel: RiskLevel;
  relatedClauseIndex: number;
}

/** Full analysis result */
export interface AnalysisResult {
  documentId: string;
  documentType: DocumentType;
  filename: string;
  clauses: ScoredClause[];
  gotchas: GotchaItem[];
  summary: {
    total: number;
    standard: number;
    caution: number;
    unfavorable: number;
  };
  analyzedAt: string;
}

/** Upload response */
export interface UploadResponse {
  documentId: string;
  status: DocumentStatus;
  message: string;
}

/** Document status response */
export interface StatusResponse {
  documentId: string;
  filename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  errorMessage: string | null;
}

/** Analyze trigger response */
export interface AnalyzeResponse {
  documentId: string;
  status: string;
  message: string;
  summary?: {
    total: number;
    standard: number;
    caution: number;
    unfavorable: number;
  };
}

/** Gotchas response */
export interface GotchasResponse {
  disclaimer: string;
  gotchas: GotchaItem[];
}
