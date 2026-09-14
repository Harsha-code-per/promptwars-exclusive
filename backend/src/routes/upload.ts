import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/env';
import { query, queryOne } from '../db/connection';
import { isSupported, SUPPORTED_EXTENSIONS } from '../modules/ingestion/textExtractor';
import { ingestDocument } from '../modules/ingestion/ingestionPipeline';
import { DocumentStatus, DocumentType } from '../types';
import { validateBody, documentTypeSchema } from '../middleware/validation';
import { truncateForLog } from '../utils';

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

function createUpload() {
  const config = getConfig();
  return multer({
    storage,
    limits: {
      fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (isSupported(file.originalname)) {
        cb(null, true);
      } else {
        (req as any).fileValidationError = `Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`;
        cb(null, false);
      }
    },
  });
}

/**
 * POST /api/documents/upload
 * Upload a contract document for analysis.
 */
router.post(
  '/upload',
  (req: Request, res: Response, next) => {
    const upload = createUpload();
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: { message: `File too large. Maximum size: ${getConfig().MAX_FILE_SIZE_MB}MB` },
            });
            return;
          }
        }
        res.status(400).json({ error: { message: err.message } });
        return;
      }
      next();
    });
  },
  validateBody(documentTypeSchema),
  async (req: Request, res: Response) => {
    try {
      if ((req as any).fileValidationError) {
        res.status(400).json({ error: { message: (req as any).fileValidationError } });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: { message: 'No file uploaded' } });
        return;
      }

      const documentType = req.body.documentType as DocumentType;
      const documentId = uuidv4();

      console.log(
        `[upload] New document: ${documentId}, type: ${documentType}, ` +
        `file: ${truncateForLog(req.file.originalname, 50)}`
      );

      // Create document record
      await query(
        `INSERT INTO documents (id, filename, document_type, status)
         VALUES ($1, $2, $3, $4)`,
        [documentId, req.file.originalname, documentType, DocumentStatus.Uploaded]
      );

      // Start ingestion pipeline asynchronously
      ingestDocument(req.file.path, documentId, documentType)
        .then(() => {
          console.log(`[upload] Ingestion complete for ${documentId}`);
        })
        .catch((err) => {
          console.error(`[upload] Ingestion failed for ${documentId}:`, (err as Error).message);
        });

      res.status(201).json({
        documentId,
        status: DocumentStatus.Uploaded,
        message: 'Document uploaded. Processing will begin shortly.',
      });
    } catch (err) {
      console.error('[upload] Error:', (err as Error).message);
      res.status(500).json({ error: { message: 'Upload failed. Please try again.' } });
    }
  }
);

/**
 * GET /api/documents/:id/status
 * Check the processing status of a document.
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const doc = await queryOne<{
      id: string;
      filename: string;
      document_type: string;
      status: string;
      error_message: string | null;
    }>(
      'SELECT id, filename, document_type, status, error_message FROM documents WHERE id = $1',
      [req.params.id]
    );

    if (!doc) {
      res.status(404).json({ error: { message: 'Document not found' } });
      return;
    }

    res.json({
      documentId: doc.id,
      filename: doc.filename,
      documentType: doc.document_type,
      status: doc.status,
      errorMessage: doc.error_message,
    });
  } catch (err) {
    console.error('[status] Error:', (err as Error).message);
    res.status(500).json({ error: { message: 'Failed to fetch document status.' } });
  }
});

export default router;
