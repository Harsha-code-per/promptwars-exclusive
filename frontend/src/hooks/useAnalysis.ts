import { useState, useEffect, useCallback, useRef } from 'react';
import { getDocumentStatus, analyzeDocument, getAnalysis } from '../services/api';
import type { AnalysisResult, DocumentStatus } from '../types';

interface UseAnalysisReturn {
  status: DocumentStatus | null;
  analysis: AnalysisResult | null;
  error: string | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  startAnalysis: () => void;
}

/**
 * Custom hook for managing the document analysis lifecycle.
 * Polls status, triggers analysis, and fetches results.
 */
export function useAnalysis(documentId: string | null): UseAnalysisReturn {
  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for document status
  const pollStatus = useCallback(async () => {
    if (!documentId) return;

    try {
      const statusRes = await getDocumentStatus(documentId);
      setStatus(statusRes.status);

      if (statusRes.status === 'processing') {
        // Continue polling
        return;
      }

      if (statusRes.status === 'error') {
        setError(statusRes.errorMessage || 'Document processing failed');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsLoading(false);
        return;
      }

      // Status is 'uploaded' — ready for analysis
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsLoading(false);
    } catch (err) {
      console.warn('[useAnalysis] Status check transient error, retrying next poll:', err);
    }
  }, [documentId]);

  // Start polling when documentId changes
  useEffect(() => {
    if (!documentId) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setStatus(null);

    // Immediate check
    pollStatus();

    // Start polling every 2 seconds
    pollIntervalRef.current = window.setInterval(pollStatus, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [documentId, pollStatus]);

  // Trigger analysis
  const startAnalysis = useCallback(async () => {
    if (!documentId) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analyzeRes = await analyzeDocument(documentId);

      if (analyzeRes.status === 'already_analyzed') {
        // Fetch existing results
        const result = await getAnalysis(documentId);
        setAnalysis(result);
        setStatus('analyzed');
        setIsAnalyzing(false);
        return;
      }

      // Poll for analysis completion
      const checkAnalysis = async () => {
        try {
          const result = await getAnalysis(documentId);
          setAnalysis(result);
          setStatus('analyzed');
          setIsAnalyzing(false);
          return true;
        } catch {
          return false;
        }
      };

      // Poll every 3 seconds for analysis completion
      const analysisPoll = setInterval(async () => {
        const done = await checkAnalysis();
        if (done) {
          clearInterval(analysisPoll);
        }
      }, 3000);

      // Also check immediately after trigger returns
      if (analyzeRes.summary) {
        const done = await checkAnalysis();
        if (done) {
          clearInterval(analysisPoll);
        }
      }

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(analysisPoll);
        if (!analysis) {
          setError('Analysis timed out. Please try again.');
          setIsAnalyzing(false);
        }
      }, 300000);

    } catch (err) {
      setError((err as Error).message);
      setIsAnalyzing(false);
    }
  }, [documentId, analysis]);

  return {
    status,
    analysis,
    error,
    isLoading,
    isAnalyzing,
    startAnalysis,
  };
}
