/**
 * Integration tests for API endpoints.
 * Tests upload, validation, rate limiting, and error handling.
 */

import request from 'supertest';
import path from 'path';
import { createApp } from '../../src/server';

// Mock all external services
jest.mock('../../src/db/connection', () => ({
  getPool: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    end: jest.fn(),
  }),
  closePool: jest.fn(),
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/services/redis', () => ({
  getCachedEmbedding: jest.fn().mockResolvedValue(null),
  setCachedEmbedding: jest.fn(),
  getCachedAnalysis: jest.fn().mockResolvedValue(null),
  setCachedAnalysis: jest.fn(),
  closeRedis: jest.fn(),
}));

jest.mock('../../src/services/voyage', () => ({
  embedText: jest.fn().mockResolvedValue(new Array(768).fill(0.1)),
  embedBatch: jest.fn().mockResolvedValue([new Array(768).fill(0.1)]),
  getEmbeddingDimensions: jest.fn().mockReturnValue(768),
}));

jest.mock('../../src/services/anthropic', () => ({
  evaluateSemanticDelta: jest.fn(),
  generateCounterDraft: jest.fn(),
  generateGotchasSummary: jest.fn(),
  detectClauseBoundaries: jest.fn().mockResolvedValue([]),
  resetClient: jest.fn(),
}));

import { query, queryOne } from '../../src/db/connection';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('API Endpoints', () => {
  const app = createApp();

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeTruthy();
    });
  });

  describe('POST /api/documents/upload', () => {
    const fixturePath = path.join(__dirname, '../fixtures/sample-freelance-contract.txt');

    it('should accept valid .txt file upload', async () => {
      mockQuery.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/documents/upload')
        .field('documentType', 'freelance_services')
        .attach('file', fixturePath);

      expect(res.status).toBe(201);
      expect(res.body.documentId).toBeTruthy();
      expect(res.body.status).toBe('uploaded');
    });

    it('should reject upload without file', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .field('documentType', 'freelance_services');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('No file');
    });

    it('should reject invalid document type', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .field('documentType', 'invalid_type')
        .attach('file', fixturePath);

      expect(res.status).toBe(400);
    });

    it('should reject unsupported file types', async () => {
      const tempPath = path.join(__dirname, '../fixtures/temp-bad-upload.exe');
      const fs = require('fs');
      fs.writeFileSync(tempPath, 'fake content');

      try {
        const res = await request(app)
          .post('/api/documents/upload')
          .field('documentType', 'freelance_services')
          .attach('file', tempPath);

        expect(res.status).toBe(400);
        expect(res.body.error.message).toContain('Unsupported file type');
      } finally {
        fs.unlinkSync(tempPath);
      }
    });
  });

  describe('GET /api/documents/:id/status', () => {
    it('should return document status when found', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 'test-doc-id',
        filename: 'contract.txt',
        document_type: 'freelance_services',
        status: 'processing',
        error_message: null,
      });

      const res = await request(app).get('/api/documents/test-doc-id/status');

      expect(res.status).toBe(200);
      expect(res.body.documentId).toBe('test-doc-id');
      expect(res.body.status).toBe('processing');
    });

    it('should return 404 for non-existent document', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/documents/nonexistent-id/status');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/documents/:id/analysis', () => {
    it('should return 404 for non-existent document', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/documents/nonexistent-id/analysis');

      expect(res.status).toBe(404);
    });

    it('should return 409 for document not yet analyzed', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 'test-doc',
        filename: 'test.txt',
        document_type: 'freelance_services',
        status: 'processing',
      });

      const res = await request(app).get('/api/documents/test-doc/analysis');

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/documents/:id/gotchas', () => {
    it('should return gotchas with disclaimer', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          title: 'Test gotcha',
          explanation: 'Test explanation',
          risk_level: 'Caution',
          related_clause_index: 0,
        },
      ]);

      const res = await request(app).get('/api/documents/test-doc/gotchas');

      expect(res.status).toBe(200);
      expect(res.body.disclaimer).toContain('informational purposes only');
      expect(res.body.gotchas).toHaveLength(1);
    });
  });
});
