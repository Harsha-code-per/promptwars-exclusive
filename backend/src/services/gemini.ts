import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConfig } from '../config/env';
import { RiskLevel } from '../types';
import type { SemanticDeltaResult, CounterDraftResult, GotchaItem, LLMClauseSplitResult } from '../types';
import { chunkArray } from '../utils';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const config = getConfig();
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return genAI;
}

const DISCLAIMER = `IMPORTANT: Your output is for informational purposes only and does not constitute legal advice. Always recommend consulting a licensed attorney for binding guidance.`;

// Prioritized Frontier Gemini Cascade
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-pro',
  'gemini-3.1-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];
let activeModel = CANDIDATE_MODELS[0];

export function getActiveModel(): string {
  return activeModel;
}

export function setActiveModel(model: string): void {
  activeModel = model;
}

/**
 * Helper to call Gemini and get a text response with automatic model fallback chain:
 * gemini-3.8-flash -> gemini-3.1-pro -> gemini-3.1-flash-lite -> gemini-2.5-pro -> gemini-2.5-flash
 */
async function generateText(systemPrompt: string, userPrompt: string, maxTokens: number = 2048): Promise<string> {
  const client = getClient();
  let lastError: Error | null = null;

  const modelsToTry = [
    activeModel,
    ...CANDIDATE_MODELS.filter((m) => m !== activeModel),
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    const isLastModel = i === modelsToTry.length - 1;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(userPrompt);
        if (modelName !== activeModel) {
          console.log(`[gemini] Switched active model to: ${modelName}`);
          activeModel = modelName;
        }
        return result.response.text();
      } catch (err) {
        lastError = err as Error;
        const msg = (err as Error).message || '';
        const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('ResourceExhausted');

        if (isTransient && attempt === 0) {
          console.warn(`[gemini] ${modelName} transient rate limit or demand spike, retrying in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        if (!isLastModel) {
          const nextModel = modelsToTry[i + 1];
          console.warn(`[gemini] ${modelName} failed (${msg.slice(0, 100)}). Switching to ${nextModel}...`);
          activeModel = nextModel;
          break;
        }
      }
    }
  }

  throw lastError || new Error(`All candidate Gemini models failed: ${CANDIDATE_MODELS.join(', ')}`);
}

// -------------------------------------------------------------
// EMBEDDING SERVICES (for pgvector 768-dim storage)
// -------------------------------------------------------------
const PRIMARY_EMBEDDING_MODEL = 'text-embedding-004';
const FALLBACK_EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const MAX_BATCH_SIZE = 8;
let activeEmbeddingModel = PRIMARY_EMBEDDING_MODEL;

export async function embedText(text: string): Promise<number[]> {
  const results = await embedBatch([text]);
  return results[0];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getClient();
  const batches = chunkArray(texts, MAX_BATCH_SIZE);
  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    try {
      const model = client.getGenerativeModel({ model: activeEmbeddingModel });
      const result = await model.batchEmbedContents({
        requests: batch.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      });

      const embeddings = result.embeddings.map((e) => e.values);
      allEmbeddings.push(...embeddings);
    } catch (err) {
      if (activeEmbeddingModel === PRIMARY_EMBEDDING_MODEL) {
        console.warn(`[gemini-embed] ${PRIMARY_EMBEDDING_MODEL} failed, falling back to ${FALLBACK_EMBEDDING_MODEL}`);
        activeEmbeddingModel = FALLBACK_EMBEDDING_MODEL;
        const fallbackModel = client.getGenerativeModel({ model: activeEmbeddingModel });
        const result = await fallbackModel.batchEmbedContents({
          requests: batch.map((text) => ({
            content: { role: 'user', parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        });

        const embeddings = result.embeddings.map((e) => e.values);
        allEmbeddings.push(...embeddings);
      } else {
        throw err;
      }
    }
  }

  return allEmbeddings;
}

export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}

// -------------------------------------------------------------
// SEMANTIC DELTA & RISK SCORING
// -------------------------------------------------------------
export async function evaluateSemanticDelta(
  clauseText: string,
  benchmarkText: string,
  clauseType: string
): Promise<SemanticDeltaResult> {
  const systemPrompt = `You are a contract analysis assistant that helps people understand legal documents. ${DISCLAIMER}
You evaluate directional legal variance between a contract clause and a market-standard benchmark clause.
Respond with valid JSON only, no markdown formatting.`;

  const userPrompt = `Compare this uploaded clause against the market-standard benchmark for a "${clauseType}" clause.

UPLOADED CLAUSE:
${clauseText}

BENCHMARK (MARKET-STANDARD) CLAUSE:
${benchmarkText}

Respond with JSON in this exact format:
{
  "riskLevel": "Standard" | "Caution" | "Unfavorable",
  "explanation": "A plain-language explanation of the key differences and practical implications. Keep it concise (2-4 sentences). Do not provide legal advice."
}`;

  try {
    const text = await generateText(systemPrompt, userPrompt, 1024);
    const parsed = JSON.parse(text);
    const riskLevel = Object.values(RiskLevel).includes(parsed.riskLevel)
      ? parsed.riskLevel as RiskLevel
      : RiskLevel.Caution;

    return {
      riskLevel,
      explanation: parsed.explanation || 'Unable to generate explanation.',
    };
  } catch (err) {
    console.error('[gemini] Failed to parse semantic delta response:', (err as Error).message);
    return {
      riskLevel: RiskLevel.Caution,
      explanation: 'Analysis could not be completed. Please review this clause carefully.',
    };
  }
}

export async function evaluateSemanticDeltaBatch(
  items: Array<{
    clauseIndex: number;
    clauseType: string;
    clauseText: string;
    benchmarkText: string;
  }>
): Promise<Map<number, SemanticDeltaResult>> {
  const resultMap = new Map<number, SemanticDeltaResult>();
  if (items.length === 0) return resultMap;

  if (items.length === 1) {
    const single = await evaluateSemanticDelta(items[0].clauseText, items[0].benchmarkText, items[0].clauseType);
    resultMap.set(items[0].clauseIndex, single);
    return resultMap;
  }

  const systemPrompt = `You are a contract analysis assistant that helps people understand legal documents. ${DISCLAIMER}
You evaluate directional legal variance between contract clauses and market-standard benchmark clauses.
Respond with a JSON array:
[
  {
    "clauseIndex": number (from input),
    "riskLevel": "Standard" | "Caution" | "Unfavorable",
    "explanation": "Concise plain-language explanation of key differences (1-3 sentences). Do not provide legal advice."
  }
]`;

  const userPrompt = items.map((item) => `---
CLAUSE INDEX: ${item.clauseIndex}
TYPE: ${item.clauseType}
UPLOADED TEXT:
${item.clauseText}
BENCHMARK TEXT:
${item.benchmarkText}`).join('\n\n');

  try {
    const text = await generateText(systemPrompt, userPrompt, 4096);
    const parsed = JSON.parse(text) as Array<{
      clauseIndex: number;
      riskLevel: string;
      explanation: string;
    }>;

    for (const res of parsed) {
      const riskLevel = Object.values(RiskLevel).includes(res.riskLevel as RiskLevel)
        ? (res.riskLevel as RiskLevel)
        : RiskLevel.Caution;
      resultMap.set(res.clauseIndex, {
        riskLevel,
        explanation: res.explanation || 'Reviewed against market standard benchmark.',
      });
    }
  } catch (err) {
    console.warn('[gemini] Batch evaluation fallback to individual scoring:', (err as Error).message);
    for (const item of items) {
      const single = await evaluateSemanticDelta(item.clauseText, item.benchmarkText, item.clauseType);
      resultMap.set(item.clauseIndex, single);
    }
  }

  return resultMap;
}

// -------------------------------------------------------------
// COUNTER-DRAFT GENERATION
// -------------------------------------------------------------
export async function generateCounterDraft(
  clauseText: string,
  benchmarkText: string,
  clauseType: string,
  riskLevel: RiskLevel,
  explanation: string
): Promise<CounterDraftResult> {
  const systemPrompt = `You are a contract drafting assistant that helps create fairer contract language. ${DISCLAIMER}
You generate alternative clause wording addressing identified risks while remaining commercially reasonable. Base your suggestions on the market-standard benchmark provided.`;

  const userPrompt = `Generate a fairer alternative for this "${clauseType}" clause flagged as "${riskLevel}".

CURRENT CLAUSE:
${clauseText}

MARKET-STANDARD BENCHMARK:
${benchmarkText}

IDENTIFIED ISSUES:
${explanation}

Respond with JSON in this exact format:
{
  "counterDraft": "The full text of the proposed alternative clause, ready to copy-paste.",
  "explanation": "A brief explanation (2-3 sentences) of what was changed and why."
}`;

  try {
    const text = await generateText(systemPrompt, userPrompt, 2048);
    const parsed = JSON.parse(text);
    return {
      counterDraft: parsed.counterDraft || 'Counter-draft generation failed. Please consult an attorney.',
      explanation: parsed.explanation || '',
    };
  } catch (err) {
    console.error('[gemini] Failed to parse counter-draft response:', (err as Error).message);
    return {
      counterDraft: 'Counter-draft generation could not be completed.',
      explanation: 'Please consult a licensed attorney for alternative language.',
    };
  }
}

// -------------------------------------------------------------
// "BEFORE YOU SIGN" GOTCHAS SUMMARY
// -------------------------------------------------------------
export async function generateGotchasSummary(
  flaggedClauses: Array<{
    clauseType: string;
    clauseText: string;
    riskLevel: RiskLevel;
    explanation: string;
    clauseIndex: number;
  }>
): Promise<GotchaItem[]> {
  if (flaggedClauses.length === 0) return [];

  const clauseSummaries = flaggedClauses
    .map((c, i) => `${i + 1}. [${c.riskLevel}] ${c.clauseType} (Clause #${c.clauseIndex + 1}): ${c.explanation}`)
    .join('\n');

  const systemPrompt = `You are a plain-language contract summary assistant. ${DISCLAIMER}
You create "Before You Sign" summaries explaining practical implications for someone without legal training.`;

  const userPrompt = `Create a "Before You Sign" summary for these flagged clauses:
${clauseSummaries}

Respond with a JSON array:
[
  {
    "title": "Short attention-grabbing title (e.g., 'Uncapped Liability Trap')",
    "explanation": "1-2 sentence plain-language explanation of practical impact.",
    "riskLevel": "Caution" or "Unfavorable",
    "relatedClauseIndex": <0-based index of the clause>
  }
]`;

  try {
    const text = await generateText(systemPrompt, userPrompt, 2048);
    const parsed = JSON.parse(text) as GotchaItem[];
    return parsed.map((g) => ({
      title: g.title || 'Review Required',
      explanation: g.explanation || 'This clause needs careful review.',
      riskLevel: Object.values(RiskLevel).includes(g.riskLevel) ? g.riskLevel : RiskLevel.Caution,
      relatedClauseIndex: g.relatedClauseIndex ?? 0,
    }));
  } catch (err) {
    console.error('[gemini] Failed to parse gotchas response:', (err as Error).message);
    return [{
      title: 'Manual Review Recommended',
      explanation: 'Please review all flagged clauses with licensed counsel.',
      riskLevel: RiskLevel.Caution,
      relatedClauseIndex: 0,
    }];
  }
}

// -------------------------------------------------------------
// BOUNDARY SPLITTER FALLBACK
// -------------------------------------------------------------
export async function detectClauseBoundaries(
  documentText: string
): Promise<LLMClauseSplitResult[]> {
  const systemPrompt = `You are a document structure analyzer. Your task is to identify distinct clauses or sections in a legal contract and classify each one by type. Be thorough.`;

  const userPrompt = `Analyze this contract and identify each distinct clause or section.

CONTRACT TEXT:
${documentText}

Respond with a JSON array:
[
  {
    "clauseType": "Payment Terms" | "Scope of Work" | "Intellectual Property" | "Confidentiality" | "Indemnification" | "Limitation of Liability" | "Termination" | "Dispute Resolution" | "Governing Law" | "Non-Compete/Non-Solicitation" | "General",
    "clauseText": "The complete text of this clause."
  }
]`;

  try {
    const text = await generateText(systemPrompt, userPrompt, 4096);
    return JSON.parse(text) as LLMClauseSplitResult[];
  } catch (err) {
    console.error('[gemini] Failed to parse clause boundary response:', (err as Error).message);
    return [];
  }
}

export function resetClient(): void {
  genAI = null;
}
