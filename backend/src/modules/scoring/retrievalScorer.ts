import { query } from '../../db/connection';
import type { DocumentType } from '../../types';

/** Result from a cosine similarity search against benchmarks */
export interface BenchmarkMatch {
  benchmarkId: string;
  benchmarkClauseType: string;
  benchmarkText: string;
  similarity: number;
}

/**
 * Stage 1: Cosine similarity search against benchmark clauses.
 * Uses pgvector's HNSW index with <=> (cosine distance) operator.
 * 
 * @param embedding - The clause embedding to search for
 * @param documentType - Filter benchmarks by document type
 * @param topK - Number of nearest neighbors to return
 * @returns Sorted array of benchmark matches with similarity scores
 */
export async function findNearestBenchmarks(
  embedding: number[],
  documentType: DocumentType,
  topK: number = 3
): Promise<BenchmarkMatch[]> {
  const embeddingStr = `[${embedding.join(',')}]`;

  // pgvector cosine distance: <=> returns distance (0 = identical, 2 = opposite)
  // We convert to similarity: 1 - distance
  const rows = await query<{
    id: string;
    clause_type: string;
    clause_text: string;
    distance: number;
  }>(
    `SELECT 
       id,
       clause_type,
       clause_text,
       (embedding <=> $1::vector) as distance
     FROM benchmark_clauses
     WHERE document_type = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [embeddingStr, documentType, topK]
  );

  return rows.map((row) => ({
    benchmarkId: row.id,
    benchmarkClauseType: row.clause_type,
    benchmarkText: row.clause_text,
    similarity: 1 - row.distance, // Convert distance to similarity
  }));
}

/**
 * Similarity threshold for Stage 2 (semantic delta analysis).
 * Clauses below this threshold have no good benchmark match,
 * so they default to "Caution" without an LLM call.
 */
export const SIMILARITY_THRESHOLD = 0.65;
