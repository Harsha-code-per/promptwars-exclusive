import { generateCounterDraft as generateCounterDraftLLM } from '../../services/gemini';
import { query } from '../../db/connection';
import { RiskLevel } from '../../types';
import type { ScoredClause } from '../../types';

const MAX_COUNTER_DRAFTS = 4;

/**
 * Generate counter-drafts for top Caution/Unfavorable clauses.
 * Prioritizes Unfavorable clauses first, then Caution.
 * Only runs on flagged clauses that have a benchmark match.
 */
export async function generateCounterDrafts(
  clauses: ScoredClause[]
): Promise<ScoredClause[]> {
  const updatedMap = new Map<number, ScoredClause>();
  clauses.forEach((c) => updatedMap.set(c.clauseIndex, { ...c }));

  // Find eligible clauses
  const eligible = clauses.filter(
    (c) =>
      c.riskLevel !== RiskLevel.Standard &&
      Boolean(c.nearestBenchmarkText) &&
      Boolean(c.semanticDeltaExplanation)
  );

  // Prioritize Unfavorable first, then Caution
  eligible.sort((a, b) => {
    if (a.riskLevel === RiskLevel.Unfavorable && b.riskLevel !== RiskLevel.Unfavorable) return -1;
    if (b.riskLevel === RiskLevel.Unfavorable && a.riskLevel !== RiskLevel.Unfavorable) return 1;
    return a.clauseIndex - b.clauseIndex;
  });

  const targets = eligible.slice(0, MAX_COUNTER_DRAFTS);
  console.log(`[counterdraft] Generating counter-drafts for top ${targets.length} priority flagged clauses`);

  for (const clause of targets) {
    console.log(
      `[counterdraft] Generating counter-draft for clause ${clause.clauseIndex}: ${clause.clauseType} (${clause.riskLevel})`
    );

    try {
      const result = await generateCounterDraftLLM(
        clause.clauseText,
        clause.nearestBenchmarkText!,
        clause.clauseType,
        clause.riskLevel,
        clause.semanticDeltaExplanation!
      );

      const updatedClause: ScoredClause = {
        ...clause,
        counterDraft: result.counterDraft,
        counterDraftExplanation: result.explanation,
      };

      // Update database
      await query(
        `UPDATE clauses SET counter_draft = $1, counter_draft_explanation = $2 WHERE id = $3`,
        [result.counterDraft, result.explanation, clause.id]
      );

      updatedMap.set(clause.clauseIndex, updatedClause);

      // Pacing delay to stay well below rate limit
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(
        `[counterdraft] Error generating counter-draft for clause ${clause.clauseIndex}:`,
        (err as Error).message
      );
    }
  }

  const resultList = Array.from(updatedMap.values()).sort((a, b) => a.clauseIndex - b.clauseIndex);
  const generated = resultList.filter((c) => c.counterDraft !== null).length;
  console.log(`[counterdraft] Generated ${generated} counter-drafts`);

  return resultList;
}
