import fs from 'fs';
import path from 'path';
import { getPool, closePool } from './connection';

/**
 * Run database migrations in order.
 * Tracks applied migrations in the `migrations` table.
 */
async function migrate(): Promise<void> {
  const pool = getPool();

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Read migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // Check if already applied
    const { rows } = await pool.query(
      'SELECT id FROM migrations WHERE name = $1',
      [file]
    );

    if (rows.length > 0) {
      console.log(`[migrate] Skipping ${file} (already applied)`);
      continue;
    }

    // Apply migration
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`[migrate] Applying ${file}...`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`[migrate] Applied ${file} ✓`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] Failed to apply ${file}:`, (err as Error).message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('[migrate] All migrations applied.');
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] Fatal error:', err.message);
      process.exit(1);
    });
}

export { migrate };
