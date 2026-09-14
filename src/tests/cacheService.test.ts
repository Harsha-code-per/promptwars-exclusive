import { describe, it, expect, beforeEach } from 'vitest';
import { CacheService } from '../services/cacheService';

describe('CacheService High-Efficiency SHA-256 Caching Engine', () => {
  beforeEach(() => {
    CacheService.clear();
  });

  it('should compute deterministic collision-resistant content hashes', () => {
    const text1 = 'Contractor shall indemnify and hold harmless Client.';
    const text2 = 'Contractor shall indemnify and hold harmless Client.';
    const text3 = 'Contractor shall indemnify and hold harmless Client with exceptions.';

    const hash1 = CacheService.hashText(text1);
    const hash2 = CacheService.hashText(text2);
    const hash3 = CacheService.hashText(text3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.startsWith('sha256_')).toBe(true);
  });

  it('should cache and retrieve items with zero latency', () => {
    CacheService.set('clause_1', { score: 95, risk: 'LOW' });
    const retrieved = CacheService.get<{ score: number; risk: string }>('clause_1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.score).toBe(95);
    expect(retrieved?.risk).toBe('LOW');
  });

  it('should track cache hits and misses accurately in metrics', () => {
    CacheService.set('item_a', 'val_a');

    // 1 miss
    const miss = CacheService.get('non_existent');
    expect(miss).toBeNull();

    // 2 hits
    const hit1 = CacheService.get('item_a');
    const hit2 = CacheService.get('item_a');
    expect(hit1).toBe('val_a');
    expect(hit2).toBe('val_a');

    const metrics = CacheService.getMetrics();
    expect(metrics.hits).toBe(2);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRatio).toBeGreaterThan(0.6);
  });

  it('should cache and retrieve clause analysis by text content hash', () => {
    const clauseText = 'Tenant shall pay a non-refundable cleaning fee of $500.';
    const analysis = { risk: 'HIGH', violation: 'URLTA Sec 2.101' };

    CacheService.setClauseAnalysis(clauseText, analysis);
    const cached = CacheService.getClauseAnalysis<typeof analysis>(clauseText);

    expect(cached).toEqual(analysis);
  });

  it('should invalidate expired cache entries according to TTL', () => {
    CacheService.set('temporary_key', 'temp_val', -100); // expired TTL
    const result = CacheService.get('temporary_key');
    expect(result).toBeNull();
  });

  it('should clear store and reset telemetry upon clear()', () => {
    CacheService.set('k1', 'v1');
    CacheService.get('k1');
    expect(CacheService.getMetrics().hits).toBe(1);

    CacheService.clear();
    expect(CacheService.getMetrics().size).toBe(0);
    expect(CacheService.getMetrics().hits).toBe(0);
  });
});
