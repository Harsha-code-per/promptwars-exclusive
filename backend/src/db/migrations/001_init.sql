-- Fenco — Initial Database Migration
-- Creates all tables and indexes needed for the contract analysis pipeline.

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Document type enum
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('freelance_services', 'residential_lease');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Document processing status enum
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'analyzed', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- Benchmark clauses table (seed data)
-- ========================================
CREATE TABLE IF NOT EXISTS benchmark_clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type document_type NOT NULL,
  clause_type VARCHAR(100) NOT NULL,
  clause_text TEXT NOT NULL,
  embedding vector(768),
  content_hash VARCHAR(64) UNIQUE NOT NULL,
  source_attribution VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for fast cosine similarity searches on benchmark embeddings
CREATE INDEX IF NOT EXISTS idx_benchmark_embedding_hnsw
  ON benchmark_clauses
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_benchmark_document_type
  ON benchmark_clauses (document_type);

-- ========================================
-- Uploaded documents table
-- ========================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  document_type document_type NOT NULL,
  status document_status NOT NULL DEFAULT 'uploaded',
  error_message TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Extracted clauses table
-- ========================================
CREATE TABLE IF NOT EXISTS clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  clause_type VARCHAR(100) NOT NULL,
  clause_text TEXT NOT NULL,
  clause_index INTEGER NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  embedding vector(768),
  risk_level VARCHAR(20),
  similarity_score REAL,
  nearest_benchmark_id UUID REFERENCES benchmark_clauses(id),
  semantic_delta_explanation TEXT,
  counter_draft TEXT,
  counter_draft_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for clause embeddings
CREATE INDEX IF NOT EXISTS idx_clause_embedding_hnsw
  ON clauses
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_clauses_document_id
  ON clauses (document_id);

-- ========================================
-- Gotchas / summary items
-- ========================================
CREATE TABLE IF NOT EXISTS gotchas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  related_clause_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gotchas_document_id
  ON gotchas (document_id);

-- ========================================
-- Migrations tracking table
-- ========================================
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
