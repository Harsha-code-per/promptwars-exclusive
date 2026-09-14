import { detectClauseBoundaries } from '../../services/gemini';
import { ClauseType } from '../../types';
import { classifyHeading, type SplitClause } from './clauseSplitter';

/**
 * LLM-based clause boundary detection.
 * Fallback when regex-based splitting produces fewer than MIN_CLAUSE_THRESHOLD clauses.
 */
export async function llmSplitClauses(documentText: string): Promise<SplitClause[]> {
  const results = await detectClauseBoundaries(documentText);

  if (results.length === 0) {
    // If LLM also fails, return the whole doc as a single clause
    return [{
      clauseType: ClauseType.General,
      clauseText: documentText.trim(),
      headingMatch: 'Full Document (LLM)',
    }];
  }

  return results.map((result) => {
    // Map the LLM's clause type string to our enum
    const clauseType = mapLLMClauseType(result.clauseType);

    return {
      clauseType,
      clauseText: result.clauseText.trim(),
      headingMatch: result.clauseType,
    };
  });
}

/**
 * Map LLM output clause type string to our ClauseType enum.
 * Falls back to classifyHeading for fuzzy matching.
 */
function mapLLMClauseType(typeStr: string): ClauseType {
  // Direct match
  const directMatch = Object.values(ClauseType).find(
    (ct) => ct.toLowerCase() === typeStr.toLowerCase()
  );
  if (directMatch) return directMatch;

  // Fuzzy match via heading classifier
  return classifyHeading(typeStr);
}
