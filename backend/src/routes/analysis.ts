import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/connection';
import { scoreClauses } from '../modules/scoring/scoringPipeline';
import { generateCounterDrafts } from '../modules/counterdraft/counterDraftGenerator';
import { generateGotchas } from '../modules/gotchas/gotchasGenerator';
import { getCachedAnalysis, setCachedAnalysis } from '../services/redis';
import { DocumentStatus, DocumentType, RiskLevel } from '../types';
import type { ExtractedClause, ScoredClause, GotchaItem, AnalysisResult } from '../types';

const router = Router();

/** Safely extract string param from Express request */
function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

/**
 * POST /api/documents/:id/analyze
 * Trigger the full analysis pipeline (scoring + counter-drafts + gotchas).
 */
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const documentId = getParamId(req);

    // Verify document exists and is in a valid state
    const doc = await queryOne<{
      id: string;
      filename: string;
      document_type: DocumentType;
      status: DocumentStatus;
    }>(
      'SELECT id, filename, document_type, status FROM documents WHERE id = $1',
      [documentId]
    );

    if (!doc) {
      res.status(404).json({ error: { message: 'Document not found' } });
      return;
    }

    if (doc.status === DocumentStatus.Processing) {
      res.status(409).json({
        error: { message: 'Document is still being processed. Please wait for processing to complete.' },
      });
      return;
    }

    if (doc.status === DocumentStatus.Error) {
      res.status(409).json({
        error: { message: 'Document processing failed. Please re-upload.' },
      });
      return;
    }

    // Check if already analyzed
    if (doc.status === DocumentStatus.Analyzed) {
      res.json({
        documentId,
        status: 'already_analyzed',
        message: 'Document has already been analyzed. Use GET /analysis to retrieve results.',
      });
      return;
    }

    // Fetch extracted clauses
    const clauseRows = await query<{
      id: string;
      document_id: string;
      clause_type: string;
      clause_text: string;
      clause_index: number;
      content_hash: string;
      embedding: string | null;
    }>(
      'SELECT id, document_id, clause_type, clause_text, clause_index, content_hash, embedding FROM clauses WHERE document_id = $1 ORDER BY clause_index',
      [documentId]
    );

    if (clauseRows.length === 0) {
      res.status(409).json({
        error: { message: 'No clauses found. Document may still be processing.' },
      });
      return;
    }

    // Parse embeddings from pgvector format
    const clauses: ExtractedClause[] = clauseRows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      clauseType: row.clause_type as any,
      clauseText: row.clause_text,
      clauseIndex: row.clause_index,
      contentHash: row.content_hash,
      embedding: row.embedding ? parseVector(row.embedding) : undefined,
    }));

    // Run scoring pipeline
    console.log(`[analysis] Starting analysis for document ${documentId}`);
    let scoredClauses = await scoreClauses(clauses, doc.document_type);

    // Generate counter-drafts
    scoredClauses = await generateCounterDrafts(scoredClauses);

    // Generate gotchas summary
    const gotchas = await generateGotchas(documentId, scoredClauses);

    // Update document status
    await query(
      'UPDATE documents SET status = $1 WHERE id = $2',
      [DocumentStatus.Analyzed, documentId]
    );

    // Build and cache analysis result
    const analysisResult = buildAnalysisResult(documentId, doc.document_type, doc.filename, scoredClauses, gotchas);
    await setCachedAnalysis(documentId, JSON.stringify(analysisResult));

    console.log(`[analysis] Analysis complete for document ${documentId}`);

    res.json({
      documentId,
      status: 'analyzed',
      message: 'Analysis complete. Use GET /analysis to retrieve full results.',
      summary: analysisResult.summary,
    });
  } catch (err) {
    console.error('[analysis] Error:', (err as Error).message);
    res.status(500).json({ error: { message: 'Analysis failed. Please try again.' } });
  }
});

/**
 * GET /api/documents/:id/analysis
 * Retrieve full analysis results for a document.
 */
router.get('/:id/analysis', async (req: Request, res: Response) => {
  try {
    const documentId = getParamId(req);

    // Check cache first
    const cached = await getCachedAnalysis(documentId);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    // Verify document exists and is analyzed
    const doc = await queryOne<{
      id: string;
      filename: string;
      document_type: DocumentType;
      status: DocumentStatus;
    }>(
      'SELECT id, filename, document_type, status FROM documents WHERE id = $1',
      [documentId]
    );

    if (!doc) {
      res.status(404).json({ error: { message: 'Document not found' } });
      return;
    }

    if (doc.status !== DocumentStatus.Analyzed) {
      res.status(409).json({
        error: { message: `Document is not yet analyzed. Current status: ${doc.status}` },
      });
      return;
    }

    // Fetch clauses with scores
    const clauseRows = await query<{
      id: string;
      document_id: string;
      clause_type: string;
      clause_text: string;
      clause_index: number;
      content_hash: string;
      risk_level: string;
      similarity_score: number;
      nearest_benchmark_id: string | null;
      semantic_delta_explanation: string | null;
      counter_draft: string | null;
      counter_draft_explanation: string | null;
    }>(
      `SELECT id, document_id, clause_type, clause_text, clause_index, content_hash,
              risk_level, similarity_score, nearest_benchmark_id, semantic_delta_explanation,
              counter_draft, counter_draft_explanation
       FROM clauses WHERE document_id = $1 ORDER BY clause_index`,
      [documentId]
    );

    // Fetch benchmark texts for matched clauses
    const benchmarkIds = clauseRows
      .map((r) => r.nearest_benchmark_id)
      .filter((id): id is string => id !== null);

    let benchmarkTexts: Record<string, string> = {};
    if (benchmarkIds.length > 0) {
      const placeholders = benchmarkIds.map((_, i) => `$${i + 1}`).join(',');
      const benchmarkRows = await query<{ id: string; clause_text: string }>(
        `SELECT id, clause_text FROM benchmark_clauses WHERE id IN (${placeholders})`,
        benchmarkIds
      );
      benchmarkTexts = Object.fromEntries(benchmarkRows.map((r) => [r.id, r.clause_text]));
    }

    const scoredClauses: ScoredClause[] = clauseRows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      clauseType: row.clause_type as any,
      clauseText: row.clause_text,
      clauseIndex: row.clause_index,
      contentHash: row.content_hash,
      riskLevel: row.risk_level as RiskLevel,
      similarityScore: row.similarity_score,
      nearestBenchmarkId: row.nearest_benchmark_id,
      nearestBenchmarkText: row.nearest_benchmark_id ? (benchmarkTexts[row.nearest_benchmark_id] || null) : null,
      semanticDeltaExplanation: row.semantic_delta_explanation,
      counterDraft: row.counter_draft,
      counterDraftExplanation: row.counter_draft_explanation,
    }));

    // Fetch gotchas
    const gotchaRows = await query<{
      title: string;
      explanation: string;
      risk_level: string;
      related_clause_index: number;
    }>(
      'SELECT title, explanation, risk_level, related_clause_index FROM gotchas WHERE document_id = $1 ORDER BY related_clause_index',
      [documentId]
    );

    const gotchas: GotchaItem[] = gotchaRows.map((row) => ({
      title: row.title,
      explanation: row.explanation,
      riskLevel: row.risk_level as RiskLevel,
      relatedClauseIndex: row.related_clause_index,
    }));

    const result = buildAnalysisResult(documentId, doc.document_type, doc.filename, scoredClauses, gotchas);

    // Cache for future requests
    await setCachedAnalysis(documentId, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    console.error('[analysis] Error fetching analysis:', (err as Error).message);
    res.status(500).json({ error: { message: 'Failed to fetch analysis results.' } });
  }
});

/**
 * GET /api/documents/:id/clauses
 * Retrieve clause list with scores (lightweight endpoint).
 */
router.get('/:id/clauses', async (req: Request, res: Response) => {
  try {
    const docId = getParamId(req);
    const clauseRows = await query<{
      id: string;
      clause_type: string;
      clause_text: string;
      clause_index: number;
      risk_level: string | null;
      similarity_score: number | null;
    }>(
      `SELECT id, clause_type, clause_text, clause_index, risk_level, similarity_score
       FROM clauses WHERE document_id = $1 ORDER BY clause_index`,
      [docId]
    );

    if (clauseRows.length === 0) {
      res.status(404).json({ error: { message: 'No clauses found for this document' } });
      return;
    }

    res.json({ clauses: clauseRows });
  } catch (err) {
    console.error('[clauses] Error:', (err as Error).message);
    res.status(500).json({ error: { message: 'Failed to fetch clauses.' } });
  }
});

/**
 * GET /api/documents/:id/gotchas
 * Retrieve gotchas summary for a document.
 */
router.get('/:id/gotchas', async (req: Request, res: Response) => {
  try {
    const docId = getParamId(req);
    const gotchaRows = await query<{
      title: string;
      explanation: string;
      risk_level: string;
      related_clause_index: number;
    }>(
      'SELECT title, explanation, risk_level, related_clause_index FROM gotchas WHERE document_id = $1 ORDER BY related_clause_index',
      [docId]
    );

    res.json({
      disclaimer: 'This summary is for informational purposes only and does not constitute legal advice. Please consult a licensed attorney for guidance specific to your situation.',
      gotchas: gotchaRows,
    });
  } catch (err) {
    console.error('[gotchas] Error:', (err as Error).message);
    res.status(500).json({ error: { message: 'Failed to fetch gotchas.' } });
  }
});

/** Parse a pgvector string "[1.0,2.0,3.0]" into a number array */
function parseVector(vectorStr: string): number[] {
  try {
    if (typeof vectorStr === 'string') {
      return JSON.parse(vectorStr);
    }
    return vectorStr as unknown as number[];
  } catch {
    return [];
  }
}

/** Build a standardized analysis result */
function buildAnalysisResult(
  documentId: string,
  documentType: DocumentType,
  filename: string,
  clauses: ScoredClause[],
  gotchas: GotchaItem[]
): AnalysisResult {
  return {
    documentId,
    documentType,
    filename,
    clauses,
    gotchas,
    summary: {
      total: clauses.length,
      standard: clauses.filter((c) => c.riskLevel === RiskLevel.Standard).length,
      caution: clauses.filter((c) => c.riskLevel === RiskLevel.Caution).length,
      unfavorable: clauses.filter((c) => c.riskLevel === RiskLevel.Unfavorable).length,
    },
    analyzedAt: new Date(),
  };
}

export default router;
