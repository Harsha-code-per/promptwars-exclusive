import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConfig } from '../config/env';
import { chunkArray } from '../utils';

const PRIMARY_EMBEDDING_MODEL = 'text-embedding-004';
const FALLBACK_EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const MAX_BATCH_SIZE = 8;

let activeModelName = PRIMARY_EMBEDDING_MODEL;
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const config = getConfig();
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Generate an embedding for a single text using Gemini's embedding model.
 */
export async function embedText(text: string): Promise<number[]> {
  const results = await embedBatch([text]);
  return results[0];
}

/**
 * Generate embeddings for multiple texts in batches.
 * Uses text-embedding-004 (768 dimensions) with fallback to gemini-embedding-001.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getClient();
  const batches = chunkArray(texts, MAX_BATCH_SIZE);
  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    console.log(`[gemini-embed] Embedding batch of ${batch.length} texts using ${activeModelName}`);

    try {
      const model = client.getGenerativeModel({ model: activeModelName });
      const result = await model.batchEmbedContents({
        requests: batch.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      });

      const embeddings = result.embeddings.map((e) => e.values);
      allEmbeddings.push(...embeddings);
      console.log(`[gemini-embed] Batch complete (${embeddings.length} embeddings)`);
    } catch (err) {
      if (activeModelName === PRIMARY_EMBEDDING_MODEL) {
        console.warn(`[gemini-embed] ${PRIMARY_EMBEDDING_MODEL} unavailable (${(err as Error).message}), switching to ${FALLBACK_EMBEDDING_MODEL}`);
        activeModelName = FALLBACK_EMBEDDING_MODEL;
        const fallbackModel = client.getGenerativeModel({ model: activeModelName });
        const result = await fallbackModel.batchEmbedContents({
          requests: batch.map((text) => ({
            content: { role: 'user', parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        });

        const embeddings = result.embeddings.map((e) => e.values);
        allEmbeddings.push(...embeddings);
        console.log(`[gemini-embed] Batch complete with fallback (${embeddings.length} embeddings)`);
      } else {
        throw err;
      }
    }
  }

  return allEmbeddings;
}

/** Get the expected embedding dimensions */
export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}
