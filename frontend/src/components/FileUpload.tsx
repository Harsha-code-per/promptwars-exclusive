import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Building2, Briefcase, X, ArrowRight, ShieldCheck } from 'lucide-react';
import type { DocumentType } from '../types';

interface FileUploadProps {
  onUpload: (file: File, documentType: DocumentType) => void;
  isUploading: boolean;
  externalFile?: File | null;
  externalDocType?: DocumentType;
}

/**
 * Drag-and-drop file upload with enlarged, spacious dropzone and document type selection.
 * Validates file type (.txt, .pdf) and size (5MB max).
 */
export function FileUpload({ onUpload, isUploading, externalFile, externalDocType }: FileUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>(externalDocType || 'freelance_services');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(externalFile || null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['.txt', '.pdf'];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (externalFile) {
      setSelectedFile(externalFile);
      setFileError(null);
    }
  }, [externalFile]);

  useEffect(() => {
    if (externalDocType) {
      setSelectedType(externalDocType);
    }
  }, [externalDocType]);

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `Unsupported file type. Please upload ${ACCEPTED_TYPES.join(' or ')} files.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedFile && !isUploading) {
      onUpload(selectedFile, selectedType);
    }
  }, [selectedFile, selectedType, isUploading, onUpload]);

  return (
    <div className="upload-container-inner">
      {/* Document Type Selector */}
      <div className="doc-type-selector" role="radiogroup" aria-label="Select contract category">
        <button
          type="button"
          className={`doc-type-option ${selectedType === 'freelance_services' ? 'selected' : ''}`}
          onClick={() => setSelectedType('freelance_services')}
          role="radio"
          aria-checked={selectedType === 'freelance_services'}
          id="doc-type-freelance"
        >
          <div
            className="doc-type-icon"
            style={{ background: 'rgba(0, 0, 0, 0.08)', color: '#000000' }}
          >
            <Briefcase size={22} aria-hidden="true" />
          </div>
          <div className="doc-type-label">
            <h4>Freelance Services</h4>
            <p>Contractor agreements, SOWs, consulting agreements</p>
          </div>
        </button>

        <button
          type="button"
          className={`doc-type-option ${selectedType === 'residential_lease' ? 'selected' : ''}`}
          onClick={() => setSelectedType('residential_lease')}
          role="radio"
          aria-checked={selectedType === 'residential_lease'}
          id="doc-type-lease"
        >
          <div
            className="doc-type-icon"
            style={{ background: 'rgba(0, 0, 0, 0.08)', color: '#000000' }}
          >
            <Building2 size={22} aria-hidden="true" />
          </div>
          <div className="doc-type-label">
            <h4>Residential Lease</h4>
            <p>Rental agreements, tenancy contracts, residential leases</p>
          </div>
        </button>
      </div>

      {/* Enlarged Drop Zone */}
      <div
        className={`upload-zone upload-zone-enlarged ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload contract file. Drag and drop or click to browse."
        id="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          aria-hidden="true"
          id="file-input"
        />

        <div className="upload-icon-enlarged">
          {selectedFile ? (
            <FileText size={38} color="#000000" aria-hidden="true" />
          ) : (
            <Upload size={38} color="#000000" aria-hidden="true" />
          )}
        </div>

        <div className="upload-text-enlarged">
          {selectedFile ? (
            <div className="staged-file-card">
              <div className="staged-file-info">
                <span className="staged-file-name">{selectedFile.name}</span>
                <span className="staged-file-size">{(selectedFile.size / 1024).toFixed(1)} KB • Staged for audit</span>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                title="Remove and select different file"
                aria-label="Remove selected file"
                className="btn-clear-file"
              >
                <X size={16} color="#000000" />
              </button>
            </div>
          ) : (
            <>
              <h3>Drag & drop your contract here, or click to browse</h3>
              <p>Supports PDF (.pdf) and Plain Text (.txt) up to 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {fileError && (
        <p
          style={{ color: 'var(--color-unfavorable)', marginTop: 'var(--space-md)', fontSize: 'var(--font-size-sm)', fontWeight: 700, textAlign: 'center' }}
          role="alert"
        >
          {fileError}
        </p>
      )}

      {/* Submit Action */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <button
          className="btn btn-primary btn-enlarged-cta"
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          id="upload-submit"
          aria-label={
            isUploading 
              ? 'Analyzing document with Gemini 2.5 Flash...' 
              : selectedFile 
                ? 'Start clause-by-clause contract analysis' 
                : 'Select a contract file above to begin audit'
          }
        >
          {isUploading ? (
            <>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              Auditing Clauses with Gemini AI...
            </>
          ) : (
            <>
              <ShieldCheck size={20} aria-hidden="true" />
              <span>{selectedFile ? 'Start Contract Risk Audit' : 'Select a Contract to Audit'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      <div className="upload-trust-row">
        <span>🔒 100% Private</span>
        <span>•</span>
        <span>Zero Storage of Raw Documents</span>
        <span>•</span>
        <span>Parameterized SQL Defenses</span>
      </div>
    </div>
  );
}
