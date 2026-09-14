import fs from 'fs';
import path from 'path';
import { getPool, closePool } from './connection';
import { embedBatch } from '../services/gemini';
import { contentHash } from '../utils';
import type { BenchmarkClauseSeed } from '../types';

/**
 * Seed the benchmark_clauses table with curated market-standard clauses.
 * Idempotent — skips clauses whose content hash already exists.
 */
async function seed(): Promise<void> {
  const seedFile = path.join(__dirname, '../../seeds/benchmark-clauses.json');
  const rawData = fs.readFileSync(seedFile, 'utf-8');
  const clauses: BenchmarkClauseSeed[] = JSON.parse(rawData);

  console.log(`[seed] Loaded ${clauses.length} benchmark clauses from seed file`);

  const pool = getPool();

  // Check which clauses are already seeded
  const newClauses: BenchmarkClauseSeed[] = [];
  const hashes: string[] = [];

  for (const clause of clauses) {
    const hash = contentHash(clause.clauseText);
    const { rows } = await pool.query(
      'SELECT id FROM benchmark_clauses WHERE content_hash = $1',
      [hash]
    );

    if (rows.length === 0) {
      newClauses.push(clause);
      hashes.push(hash);
    } else {
      console.log(`[seed] Skipping existing clause: ${clause.clauseType} (${clause.documentType})`);
    }
  }

  if (newClauses.length === 0) {
    console.log('[seed] All benchmark clauses already seeded. Nothing to do.');
    return;
  }

  console.log(`[seed] Generating embeddings for ${newClauses.length} new clauses...`);
  const embeddings = await embedBatch(newClauses.map((c) => c.clauseText));

  console.log('[seed] Inserting clauses into database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < newClauses.length; i++) {
      const clause = newClauses[i];
      const embedding = embeddings[i];
      const hash = hashes[i];

      await client.query(
        `INSERT INTO benchmark_clauses (document_type, clause_type, clause_text, embedding, content_hash, source_attribution)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (content_hash) DO NOTHING`,
        [
          clause.documentType,
          clause.clauseType,
          clause.clauseText,
          `[${embedding.join(',')}]`,
          hash,
          clause.sourceAttribution,
        ]
      );
      console.log(`[seed] Inserted: ${clause.clauseType} (${clause.documentType})`);
    }

    await client.query('COMMIT');
    console.log(`[seed] Successfully seeded ${newClauses.length} benchmark clauses.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Error during seeding:', (err as Error).message);
    throw err;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Fatal error:', err.message);
      process.exit(1);
    });
}

export { seed };
