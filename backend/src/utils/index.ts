import crypto from 'crypto';

/**
 * Generate a SHA-256 content hash for cache keying.
 * Embedding re-computation is skipped if the hash matches a cached entry.
 */
export function contentHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Sanitize text extracted from documents to prevent XSS when rendered.
 * Strips HTML tags and normalizes control characters.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars except \t \n \r
    .replace(/\r\n/g, '\n')            // normalize line endings
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Truncate text for logging purposes.
 * Never log full contract contents — only a prefix.
 */
export function truncateForLog(text: string, maxLen: number = 80): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '... [truncated]';
}

/**
 * Normalize whitespace: collapse multiple spaces/newlines into single spaces.
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Chunk an array into batches of the given size.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
