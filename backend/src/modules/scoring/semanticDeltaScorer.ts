import { evaluateSemanticDelta } from '../../services/anthropic';
import type { SemanticDeltaResult } from '../../types';

/**
 * Stage 2: Semantic delta analysis using Google Gemini.
 * Evaluates directional legal variance between an uploaded clause and its nearest benchmark.
 * Only called for clauses that pass the Stage 1 similarity threshold.
 */
export async function analyzeSemanticDelta(
  clauseText: string,
  benchmarkText: string,
  clauseType: string
): Promise<SemanticDeltaResult> {
  return evaluateSemanticDelta(clauseText, benchmarkText, clauseType);
}
