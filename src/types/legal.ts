export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'FAVORABLE';

export type LegalDimension = 
  | 'LIABILITY'
  | 'INTELLECTUAL_PROPERTY'
  | 'TERMINATION'
  | 'RESTRICTIVE_COVENANTS'
  | 'DISPUTE_RESOLUTION';

export interface DimensionScore {
  dimension: LegalDimension;
  label: string;
  score: number; // 0 (extreme danger) to 100 (safe/balanced)
  riskLevel: RiskLevel;
  riskCount: number;
  summary: string;
}

export interface AnalyzedClause {
  id: string;
  clauseNumber?: string;
  title: string;
  originalText: string;
  plainEnglish: string;
  riskLevel: RiskLevel;
  dimension: LegalDimension;
  implications: string;
  counterClause?: string;
  statutoryReference?: string;
}

export interface KeyTimeline {
  event: string;
  timeline: string;
  consequence: string;
}

export interface ActionItem {
  id: string;
  task: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  completed?: boolean;
}

export interface AttorneyBrief {
  topRedFlags: string[];
  questionsForCounsel: string[];
  negotiationPriorities: string[];
  suggestedAddendums: string[];
}

export interface ContractAnalysis {
  documentTitle: string;
  overallScore: number; // 0 - 100
  overallRating: 'CRITICAL_RISK' | 'HIGH_RISK' | 'MODERATE_RISK' | 'BALANCED_AND_SAFE';
  executiveSummary: string;
  dimensionScores: Record<LegalDimension, DimensionScore>;
  clauses: AnalyzedClause[];
  timelines: KeyTimeline[];
  checklist: ActionItem[];
  attorneyBrief: AttorneyBrief;
  piiRedacted: boolean;
  analyzedAt: string;
}

export interface DifferenceClause {
  sectionTitle: string;
  originalVersion: string;
  revisedVersion: string;
  favorabilityShift: 'FAVORS_PARTY_A' | 'FAVORS_PARTY_B' | 'NEUTRAL';
  explanation: string;
}

export interface ComparisonResult {
  docATitle: string;
  docBTitle: string;
  summary: string;
  overallAdvantage: 'DOCUMENT_A' | 'DOCUMENT_B' | 'BALANCED';
  differences: DifferenceClause[];
}

export interface Citation {
  clauseId: string;
  clauseTitle: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: Citation[];
}

export interface SampleContract {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  estimatedRisk: RiskLevel;
  content: string;
  versionBContent?: string;
}
