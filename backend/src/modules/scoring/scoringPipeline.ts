import { query } from '../../db/connection';
import { findNearestBenchmarks, SIMILARITY_THRESHOLD } from './retrievalScorer';
import { analyzeSemanticDelta } from './semanticDeltaScorer';
import { DocumentType, RiskLevel } from '../../types';
import type { ScoredClause, ExtractedClause } from '../../types';
import { truncateForLog } from '../../utils';

/**
 * Two-stage scoring pipeline:
 * 1. Cosine similarity retrieval to find nearest benchmark
 * 2. Semantic delta analysis (LLM) for clauses above similarity threshold
 * 
 * Clauses below the threshold get a default "Caution" rating
 * to avoid unnecessary LLM calls (efficiency optimization).
 */
export async function scoreClauses(
  clauses: ExtractedClause[],
  documentType: DocumentType
): Promise<ScoredClause[]> {
  const scored: ScoredClause[] = [];

  for (const clause of clauses) {
    console.log(`[scoring] Processing clause ${clause.clauseIndex}: ${clause.clauseType}`);

    if (!clause.embedding) {
      console.warn(`[scoring] No embedding for clause ${clause.clauseIndex}, skipping`);
      scored.push({
        ...clause,
        riskLevel: RiskLevel.Caution,
        similarityScore: 0,
        nearestBenchmarkId: null,
        nearestBenchmarkText: null,
        semanticDeltaExplanation: 'Clause could not be embedded for comparison.',
        counterDraft: null,
        counterDraftExplanation: null,
      });
      continue;
    }

    // Stage 1: Cosine similarity retrieval
    const matches = await findNearestBenchmarks(clause.embedding, documentType, 3);
    const bestMatch = matches.length > 0 ? matches[0] : null;
    const similarity = bestMatch?.similarity ?? 0;

    console.log(
      `[scoring] Best match similarity: ${similarity.toFixed(3)} ` +
      `(threshold: ${SIMILARITY_THRESHOLD}) for "${truncateForLog(clause.clauseText, 40)}"`
    );

    let riskLevel: RiskLevel;
    let explanation: string;

    if (!bestMatch || similarity < SIMILARITY_THRESHOLD) {
      // No good benchmark match — default to Caution
      riskLevel = RiskLevel.Caution;
      explanation = 'This clause does not closely match any market-standard benchmark in our database. ' +
        'We recommend careful review to ensure the terms are fair and balanced.';
      console.log(`[scoring] Below threshold — defaulting to Caution (no LLM call)`);
    } else {
      // Stage 2: Semantic delta analysis (LLM call)
      console.log(`[scoring] Above threshold — running semantic delta analysis`);
      const delta = await analyzeSemanticDelta(
        clause.clauseText,
        bestMatch.benchmarkText,
        clause.clauseType
      );
      riskLevel = delta.riskLevel;
      explanation = delta.explanation;
    }

    const scoredClause: ScoredClause = {
      ...clause,
      riskLevel,
      similarityScore: similarity,
      nearestBenchmarkId: bestMatch?.benchmarkId ?? null,
      nearestBenchmarkText: bestMatch?.benchmarkText ?? null,
      semanticDeltaExplanation: explanation,
      counterDraft: null,
      counterDraftExplanation: null,
    };

    // Update database
    await query(
      `UPDATE clauses SET 
        risk_level = $1, 
        similarity_score = $2, 
        nearest_benchmark_id = $3,
        semantic_delta_explanation = $4
       WHERE id = $5`,
      [riskLevel, similarity, bestMatch?.benchmarkId ?? null, explanation, clause.id]
    );

    scored.push(scoredClause);
  }

  const summary = {
    standard: scored.filter((c) => c.riskLevel === RiskLevel.Standard).length,
    caution: scored.filter((c) => c.riskLevel === RiskLevel.Caution).length,
    unfavorable: scored.filter((c) => c.riskLevel === RiskLevel.Unfavorable).length,
  };
  console.log(`[scoring] Scoring complete: ${JSON.stringify(summary)}`);

  return scored;
}
