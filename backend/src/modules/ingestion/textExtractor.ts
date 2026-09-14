import fs from 'fs';
import path from 'path';
import { sanitizeText } from '../../utils';

/**
 * Extract text content from supported file types.
 * Supports .txt and .pdf files.
 */
export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.txt':
      return extractFromTxt(filePath);
    case '.pdf':
      return extractFromPdf(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported types: .txt, .pdf`);
  }
}

/**
 * Extract text from a plain text file.
 */
function extractFromTxt(filePath: string): string {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return sanitizeText(raw);
}

/**
 * Extract text from a PDF file using pdf-parse.
 */
async function extractFromPdf(filePath: string): Promise<string> {
  // Dynamic import to avoid loading pdf-parse when not needed
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return sanitizeText(data.text);
}

/** Supported file extensions */
export const SUPPORTED_EXTENSIONS = ['.txt', '.pdf'];

/**
 * Validate that a file extension is supported.
 */
export function isSupported(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}
