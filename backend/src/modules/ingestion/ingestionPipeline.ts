import { v4 as uuidv4 } from 'uuid';
import { extractText } from './textExtractor';
import { splitClauses, MIN_CLAUSE_THRESHOLD } from './clauseSplitter';
import { llmSplitClauses } from './llmClauseSplitter';
import { embedBatch } from '../../services/gemini';
import { getCachedEmbedding, setCachedEmbedding } from '../../services/redis';
import { query } from '../../db/connection';
import { contentHash, truncateForLog } from '../../utils';
import { DocumentStatus, DocumentType } from '../../types';
import type { ExtractedClause } from '../../types';

/**
 * Full ingestion pipeline:
 * 1. Extract text from uploaded file
 * 2. Split into clauses (regex first, LLM fallback)
 * 3. Compute content hashes
 * 4. Check Redis cache for existing embeddings
 * 5. Generate embeddings for uncached clauses (batched)
 * 6. Cache new embeddings
 * 7. Store clauses in database
 */
export async function ingestDocument(
  filePath: string,
  documentId: string,
  _documentType: DocumentType
): Promise<ExtractedClause[]> {
  // Update status to processing
  await query(
    'UPDATE documents SET status = $1 WHERE id = $2',
    [DocumentStatus.Processing, documentId]
  );

  try {
    // Step 1: Extract text
    console.log(`[ingest] Extracting text from document ${documentId}`);
    const text = await extractText(filePath);
    console.log(`[ingest] Extracted ${text.length} chars from document`);

    if (text.length < 50) {
      throw new Error('Document text is too short to analyze. Please upload a contract with substantive content.');
    }

    // Step 2: Split into clauses
    console.log('[ingest] Splitting document into clauses...');
    let splitResult = splitClauses(text);
    console.log(`[ingest] Regex splitter found ${splitResult.length} clauses`);

    // If regex produces too few clauses, use LLM fallback
    if (splitResult.length < MIN_CLAUSE_THRESHOLD) {
      console.log('[ingest] Below threshold, using LLM fallback...');
      splitResult = await llmSplitClauses(text);
      console.log(`[ingest] LLM splitter found ${splitResult.length} clauses`);
    }

    // Step 3: Compute content hashes and check cache
    const clauses: ExtractedClause[] = [];
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    for (let i = 0; i < splitResult.length; i++) {
      const split = splitResult[i];
      const hash = contentHash(split.clauseText);

      const clause: ExtractedClause = {
        id: uuidv4(),
        documentId,
        clauseType: split.clauseType,
        clauseText: split.clauseText,
        clauseIndex: i,
        contentHash: hash,
      };

      // Check Redis cache
      const cachedEmbedding = await getCachedEmbedding(hash);
      if (cachedEmbedding) {
        console.log(`[ingest] Cache hit for clause ${i} (${truncateForLog(split.clauseText, 40)})`);
        clause.embedding = cachedEmbedding;
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(split.clauseText);
      }

      clauses.push(clause);
    }

    // Step 4: Batch embed uncached clauses
    if (uncachedTexts.length > 0) {
      console.log(`[ingest] Generating embeddings for ${uncachedTexts.length} uncached clauses`);
      const embeddings = await embedBatch(uncachedTexts);

      for (let j = 0; j < uncachedIndices.length; j++) {
        const idx = uncachedIndices[j];
        clauses[idx].embedding = embeddings[j];

        // Cache the new embedding
        await setCachedEmbedding(clauses[idx].contentHash, embeddings[j]);
      }
    }

    // Step 5: Store clauses in database
    console.log(`[ingest] Storing ${clauses.length} clauses in database`);
    for (const clause of clauses) {
      await query(
        `INSERT INTO clauses (id, document_id, clause_type, clause_text, clause_index, content_hash, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          clause.id,
          clause.documentId,
          clause.clauseType,
          clause.clauseText,
          clause.clauseIndex,
          clause.contentHash,
          clause.embedding ? `[${clause.embedding.join(',')}]` : null,
        ]
      );
    }

    // Mark document as uploaded (ready for analysis)
    await query(
      'UPDATE documents SET status = $1 WHERE id = $2',
      [DocumentStatus.Uploaded, documentId]
    );

    console.log(`[ingest] Document ${documentId} ingestion complete: ${clauses.length} clauses`);
    return clauses;
  } catch (err) {
    // Update status to error
    await query(
      'UPDATE documents SET status = $1, error_message = $2 WHERE id = $3',
      [DocumentStatus.Error, (err as Error).message, documentId]
    );
    throw err;
  }
}
