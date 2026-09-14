/** Document types supported by LexiGuard AI */
export enum DocumentType {
  FreelanceServices = 'freelance_services',
  ResidentialLease = 'residential_lease',
}

/** Clause type categories for contract analysis */
export enum ClauseType {
  PaymentTerms = 'Payment Terms',
  ScopeOfWork = 'Scope of Work',
  IntellectualProperty = 'Intellectual Property',
  Confidentiality = 'Confidentiality',
  Indemnification = 'Indemnification',
  LimitationOfLiability = 'Limitation of Liability',
  Termination = 'Termination',
  DisputeResolution = 'Dispute Resolution',
  GoverningLaw = 'Governing Law',
  NonCompete = 'Non-Compete/Non-Solicitation',
  Insurance = 'Insurance',
  Amendments = 'Amendments',
  ForceMajeure = 'Force Majeure',
  Warranty = 'Warranty/Representations',
  Assignment = 'Assignment',
  Notice = 'Notice',
  General = 'General',
}

/** Risk classification for scored clauses */
export enum RiskLevel {
  Standard = 'Standard',
  Caution = 'Caution',
  Unfavorable = 'Unfavorable',
}

/** Benchmark clause stored in pgvector */
export interface BenchmarkClause {
  id: string;
  documentType: DocumentType;
  clauseType: ClauseType;
  clauseText: string;
  embedding: number[];
  sourceAttribution: string;
  createdAt: Date;
}

/** Uploaded document record */
export interface DocumentRecord {
  id: string;
  filename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  uploadedAt: Date;
}

export enum DocumentStatus {
  Uploaded = 'uploaded',
  Processing = 'processing',
  Analyzed = 'analyzed',
  Error = 'error',
}

/** Clause extracted from an uploaded document */
export interface ExtractedClause {
  id?: string;
  documentId: string;
  clauseType: ClauseType;
  clauseText: string;
  clauseIndex: number;
  contentHash: string;
  embedding?: number[];
}

/** Clause after scoring */
export interface ScoredClause extends ExtractedClause {
  riskLevel: RiskLevel;
  similarityScore: number;
  nearestBenchmarkId: string | null;
  nearestBenchmarkText: string | null;
  semanticDeltaExplanation: string | null;
  counterDraft: string | null;
  counterDraftExplanation: string | null;
}

/** A gotcha item from the summary generator */
export interface GotchaItem {
  title: string;
  explanation: string;
  riskLevel: RiskLevel;
  relatedClauseIndex: number;
}

/** Full analysis result for a document */
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
  analyzedAt: Date;
}

/** Benchmark clause seed data shape */
export interface BenchmarkClauseSeed {
  documentType: DocumentType;
  clauseType: ClauseType;
  clauseText: string;
  sourceAttribution: string;
}

/** LLM clause split result */
export interface LLMClauseSplitResult {
  clauseType: string;
  clauseText: string;
  startOffset?: number;
  endOffset?: number;
}

/** Semantic delta evaluation result from LLM */
export interface SemanticDeltaResult {
  riskLevel: RiskLevel;
  explanation: string;
}

/** Counter-draft generation result from LLM */
export interface CounterDraftResult {
  counterDraft: string;
  explanation: string;
}
