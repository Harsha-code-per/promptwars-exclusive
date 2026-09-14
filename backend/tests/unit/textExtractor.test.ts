import { extractText, isSupported, SUPPORTED_EXTENSIONS } from '../../src/modules/ingestion/textExtractor';
import fs from 'fs';
import path from 'path';

describe('Text Extractor', () => {
  describe('extractText', () => {
    it('should extract text from a .txt file', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/sample-freelance-contract.txt');
      const text = await extractText(fixturePath);

      expect(text).toBeTruthy();
      expect(text.length).toBeGreaterThan(100);
      expect(text).toContain('FREELANCE SERVICES AGREEMENT');
      expect(text).toContain('Payment Terms');
      expect(text).toContain('Termination');
    });

    it('should sanitize extracted text (no HTML tags)', async () => {
      // Create a temp file with HTML tags
      const tempPath = path.join(__dirname, '../fixtures/temp-html-test.txt');
      fs.writeFileSync(tempPath, '<script>alert("xss")</script>Payment Terms. Pay within 30 days. <b>Bold text</b>');

      try {
        const text = await extractText(tempPath);
        expect(text).not.toContain('<script>');
        expect(text).not.toContain('<b>');
        expect(text).not.toContain('</b>');
        expect(text).toContain('Payment Terms');
        expect(text).toContain('Pay within 30 days');
      } finally {
        fs.unlinkSync(tempPath);
      }
    });

    it('should strip control characters', async () => {
      const tempPath = path.join(__dirname, '../fixtures/temp-control-test.txt');
      fs.writeFileSync(tempPath, 'Normal text\x00\x01\x02 with control chars\x0B\x0C here');

      try {
        const text = await extractText(tempPath);
        expect(text).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
        expect(text).toContain('Normal text');
        expect(text).toContain('with control chars');
      } finally {
        fs.unlinkSync(tempPath);
      }
    });

    it('should throw for unsupported file types', async () => {
      const tempPath = path.join(__dirname, '../fixtures/temp-bad.docx');
      fs.writeFileSync(tempPath, 'fake content');

      try {
        await expect(extractText(tempPath)).rejects.toThrow('Unsupported file type');
      } finally {
        fs.unlinkSync(tempPath);
      }
    });
  });

  describe('isSupported', () => {
    it('should accept .txt files', () => {
      expect(isSupported('contract.txt')).toBe(true);
      expect(isSupported('my-lease.TXT')).toBe(true);
    });

    it('should accept .pdf files', () => {
      expect(isSupported('agreement.pdf')).toBe(true);
      expect(isSupported('DOCUMENT.PDF')).toBe(true);
    });

    it('should reject unsupported types', () => {
      expect(isSupported('file.docx')).toBe(false);
      expect(isSupported('file.doc')).toBe(false);
      expect(isSupported('file.xlsx')).toBe(false);
      expect(isSupported('file.jpg')).toBe(false);
      expect(isSupported('file.exe')).toBe(false);
    });
  });

  describe('SUPPORTED_EXTENSIONS', () => {
    it('should include .txt and .pdf', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('.txt');
      expect(SUPPORTED_EXTENSIONS).toContain('.pdf');
    });
  });
});
