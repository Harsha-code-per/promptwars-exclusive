import { ClauseType } from '../../types';

/** A clause extracted by the splitter */
export interface SplitClause {
  clauseType: ClauseType;
  clauseText: string;
  headingMatch: string;
}

/**
 * Mapping from heading keywords to clause types.
 * Case-insensitive matching.
 */
const HEADING_TO_CLAUSE_TYPE: Record<string, ClauseType> = {
  'payment': ClauseType.PaymentTerms,
  'compensation': ClauseType.PaymentTerms,
  'fees': ClauseType.PaymentTerms,
  'rent': ClauseType.PaymentTerms,
  'scope of work': ClauseType.ScopeOfWork,
  'scope': ClauseType.ScopeOfWork,
  'services': ClauseType.ScopeOfWork,
  'deliverables': ClauseType.ScopeOfWork,
  'use of premises': ClauseType.ScopeOfWork,
  'permitted use': ClauseType.ScopeOfWork,
  'intellectual property': ClauseType.IntellectualProperty,
  'ip rights': ClauseType.IntellectualProperty,
  'ownership': ClauseType.IntellectualProperty,
  'work product': ClauseType.IntellectualProperty,
  'security deposit': ClauseType.IntellectualProperty,
  'confidential': ClauseType.Confidentiality,
  'nda': ClauseType.Confidentiality,
  'non-disclosure': ClauseType.Confidentiality,
  'privacy': ClauseType.Confidentiality,
  'indemn': ClauseType.Indemnification,
  'hold harmless': ClauseType.Indemnification,
  'limitation of liability': ClauseType.LimitationOfLiability,
  'liability': ClauseType.LimitationOfLiability,
  'damages': ClauseType.LimitationOfLiability,
  'terminat': ClauseType.Termination,
  'expiration': ClauseType.Termination,
  'dispute': ClauseType.DisputeResolution,
  'arbitration': ClauseType.DisputeResolution,
  'mediation': ClauseType.DisputeResolution,
  'governing law': ClauseType.GoverningLaw,
  'applicable law': ClauseType.GoverningLaw,
  'jurisdiction': ClauseType.GoverningLaw,
  'choice of law': ClauseType.GoverningLaw,
  'non-compete': ClauseType.NonCompete,
  'non-solicitation': ClauseType.NonCompete,
  'noncompete': ClauseType.NonCompete,
  'nonsolicitation': ClauseType.NonCompete,
  'restrictive covenant': ClauseType.NonCompete,
  'renewal': ClauseType.NonCompete,
  'insurance': ClauseType.Insurance,
  'coverage': ClauseType.Insurance,
  'amend': ClauseType.Amendments,
  'modification': ClauseType.Amendments,
  'entire agreement': ClauseType.Amendments,
  'force majeure': ClauseType.ForceMajeure,
  'act of god': ClauseType.ForceMajeure,
  'warrant': ClauseType.Warranty,
  'representation': ClauseType.Warranty,
  'condition of premises': ClauseType.Warranty,
  'habitability': ClauseType.Warranty,
  'assign': ClauseType.Assignment,
  'transfer': ClauseType.Assignment,
  'sublet': ClauseType.Assignment,
  'subleas': ClauseType.Assignment,
  'notice': ClauseType.Notice,
  'notification': ClauseType.Notice,
};

/**
 * Regex patterns for detecting clause boundaries.
 * Matches numbered sections, titled sections, and ALL-CAPS headings.
 */
const BOUNDARY_PATTERNS = [
  // "Section 1. Title" or "Section 1: Title"
  /^(?:Section|SECTION)\s+\d+[\.\:]\s*(.+)/m,
  // "ARTICLE I" or "Article 1"
  /^(?:ARTICLE|Article)\s+[IVXLCDM\d]+[\.\:]?\s*(.*)/m,
  // "1. Title" or "1.1 Title" (numbered sections)
  /^(\d+(?:\.\d+)*)\s*[\.\)]\s*(.+)/m,
  // ALL-CAPS heading on its own line (at least 2 words or specific keywords)
  /^([A-Z][A-Z\s\/\-]{3,}[A-Z])[\.\:]?\s*$/m,
  // Title Case heading followed by period: "Payment Terms."
  /^([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|of|and|or|the|for|in|to|by))*)\.\s/m,
];

/**
 * Split a contract document into clauses using regex-based boundary detection.
 * This is the fast first pass; the LLM fallback is used when this produces < 3 results.
 */
export function splitClauses(text: string): SplitClause[] {
  const lines = text.split('\n');
  const boundaries: Array<{ lineIndex: number; heading: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const pattern of BOUNDARY_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Extract the heading text (try groups in order)
        const heading = (match[2] || match[1] || match[0]).trim();
        // Skip very short or numeric-only headings
        if (heading.length > 2 && !/^\d+$/.test(heading)) {
          boundaries.push({ lineIndex: i, heading });
          break; // Only match the first pattern per line
        }
      }
    }
  }

  if (boundaries.length === 0) {
    // No boundaries found — return the whole document as a single clause
    return [{
      clauseType: ClauseType.General,
      clauseText: text.trim(),
      headingMatch: 'Full Document',
    }];
  }

  // Build clauses from boundaries
  const clauses: SplitClause[] = [];

  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].lineIndex;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].lineIndex : lines.length;
    const clauseText = lines.slice(start, end).join('\n').trim();

    if (clauseText.length < 20) continue; // Skip trivially short sections

    const clauseType = classifyHeading(boundaries[i].heading);

    clauses.push({
      clauseType,
      clauseText,
      headingMatch: boundaries[i].heading,
    });
  }

  return clauses;
}

/**
 * Classify a heading string into a ClauseType by keyword matching.
 */
export function classifyHeading(heading: string): ClauseType {
  const lower = heading.toLowerCase();

  for (const [keyword, clauseType] of Object.entries(HEADING_TO_CLAUSE_TYPE)) {
    if (lower.includes(keyword)) {
      return clauseType;
    }
  }

  return ClauseType.General;
}

/**
 * Minimum number of clauses expected from a well-structured contract.
 * Below this threshold, the LLM fallback is triggered.
 */
export const MIN_CLAUSE_THRESHOLD = 3;
