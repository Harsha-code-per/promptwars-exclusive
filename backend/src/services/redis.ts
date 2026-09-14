import Redis from 'ioredis';
import { getConfig } from '../config/env';

let redisClient: Redis | null = null;

const EMBEDDING_TTL = 60 * 60 * 24 * 7; // 7 days
const ANALYSIS_TTL = 60 * 60 * 24;       // 1 day

const inMemoryCache = new Map<string, { value: string; expiresAt: number }>();

function getRedis(): Redis | null {
  if (!redisClient) {
    try {
      const config = getConfig();
      if (!config.REDIS_URL || config.REDIS_URL.trim() === '') {
        return null;
      }
      redisClient = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 1000,
        retryStrategy: () => null, // don't hang retrying
      });

      redisClient.on('error', (_err) => {
        // Suppress connection error spam in dev without Redis
      });
    } catch {
      redisClient = null;
    }
  }
  return redisClient;
}

/**
 * Get a cached embedding by content hash.
 * Returns null if not cached.
 */
export async function getCachedEmbedding(contentHash: string): Promise<number[] | null> {
  const key = `emb:${contentHash}`;
  try {
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached) as number[];
    }
  } catch {
    // Fall back to in-memory cache
  }

  const mem = inMemoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return JSON.parse(mem.value) as number[];
  }
  return null;
}

export async function setCachedEmbedding(
  contentHash: string,
  embedding: number[]
): Promise<void> {
  const key = `emb:${contentHash}`;
  const serialized = JSON.stringify(embedding);
  inMemoryCache.set(key, { value: serialized, expiresAt: Date.now() + EMBEDDING_TTL * 1000 });

  try {
    const redis = getRedis();
    if (redis) {
      await redis.set(key, serialized, 'EX', EMBEDDING_TTL);
    }
  } catch {
    // Suppress error
  }
}

export async function getCachedAnalysis(documentId: string): Promise<string | null> {
  const key = `analysis:${documentId}`;
  try {
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get(key);
      if (cached) return cached;
    }
  } catch {
    // Fall back to in-memory
  }

  const mem = inMemoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value;
  }
  return null;
}

export async function setCachedAnalysis(
  documentId: string,
  analysis: string
): Promise<void> {
  const key = `analysis:${documentId}`;
  inMemoryCache.set(key, { value: analysis, expiresAt: Date.now() + ANALYSIS_TTL * 1000 });

  try {
    const redis = getRedis();
    if (redis) {
      await redis.set(key, analysis, 'EX', ANALYSIS_TTL);
    }
  } catch {
    // Suppress error
  }
}

/**
 * Close the Redis connection — for graceful shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/** Reset the client — used for testing */
export function resetRedis(): void {
  redisClient = null;
}
