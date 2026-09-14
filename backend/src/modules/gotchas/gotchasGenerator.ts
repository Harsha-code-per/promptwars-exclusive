import { generateGotchasSummary as generateGotchasLLM } from '../../services/gemini';
import { query } from '../../db/connection';
import { RiskLevel } from '../../types';
import type { ScoredClause, GotchaItem } from '../../types';

/**
 * Generate a "Before You Sign" gotchas summary for all flagged clauses.
 * Calls the LLM once with all flagged clauses for a cohesive summary.
 */
export async function generateGotchas(
  documentId: string,
  clauses: ScoredClause[]
): Promise<GotchaItem[]> {
  // Filter to flagged clauses only
  const flagged = clauses
    .filter((c) => c.riskLevel !== RiskLevel.Standard)
    .map((c) => ({
      clauseType: c.clauseType,
      clauseText: c.clauseText,
      riskLevel: c.riskLevel,
      explanation: c.semanticDeltaExplanation || 'Requires review.',
      clauseIndex: c.clauseIndex,
    }));

  if (flagged.length === 0) {
    console.log('[gotchas] No flagged clauses — skipping gotchas generation');
    return [];
  }

  console.log(`[gotchas] Generating gotchas summary for ${flagged.length} flagged clauses`);

  const gotchas = await generateGotchasLLM(flagged);

  // Store in database
  for (const gotcha of gotchas) {
    await query(
      `INSERT INTO gotchas (document_id, title, explanation, risk_level, related_clause_index)
       VALUES ($1, $2, $3, $4, $5)`,
      [documentId, gotcha.title, gotcha.explanation, gotcha.riskLevel, gotcha.relatedClauseIndex]
    );
  }

  console.log(`[gotchas] Generated ${gotchas.length} gotcha items`);
  return gotchas;
}
