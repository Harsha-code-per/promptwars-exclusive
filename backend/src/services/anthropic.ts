import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConfig } from '../config/env';
import { RiskLevel } from '../types';
import type { SemanticDeltaResult, CounterDraftResult, GotchaItem, LLMClauseSplitResult } from '../types';


let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const config = getConfig();
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return genAI;
}

const DISCLAIMER = `IMPORTANT: Your output is for informational purposes only and does not constitute legal advice. Always recommend consulting a licensed attorney for binding guidance.`;

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
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
 * gemini-2.5-flash -> gemini-2.5-flash-lite -> gemini-3.8-flash
 */
async function generateText(systemPrompt: string, userPrompt: string, maxTokens: number = 2048): Promise<string> {
  const client = getClient();
  let lastError: Error | null = null;

  // Prioritize current activeModel, followed by the remaining candidate models
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
        // If we succeeded using a fallback model, update activeModel so subsequent calls don't waste time failing
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
          break; // Break inner retry loop to immediately try nextModel
        }
      }
    }
  }

  throw lastError || new Error(`All candidate Gemini models failed: ${CANDIDATE_MODELS.join(', ')}`);
}

/**
 * Evaluate the semantic delta between an uploaded clause and its nearest benchmark.
 * Returns a risk classification and plain-language explanation.
 */
export async function evaluateSemanticDelta(
  clauseText: string,
  benchmarkText: string,
  clauseType: string
): Promise<SemanticDeltaResult> {
  console.log(`[gemini] Evaluating semantic delta for clause type: ${clauseType}`);

  const systemPrompt = `You are a contract analysis assistant that helps people understand legal documents. ${DISCLAIMER}

You evaluate directional legal variance between a contract clause and a market-standard benchmark clause. Focus on:
- Mutual vs. unilateral shifts (e.g., mutual indemnification changed to one-sided)
- Expanded or narrowed scope of liability, indemnity, or obligations
- Shortened notice periods, cure periods, or payment terms
- Missing standard protections or added unusual obligations
- Unusual governing law or venue choices
- Any terms that are substantially worse than the benchmark for one party

Respond with valid JSON only, no markdown formatting.`;

  const userPrompt = `Compare this uploaded clause against the market-standard benchmark for a "${clauseType}" clause.

UPLOADED CLAUSE:
${clauseText}

BENCHMARK (MARKET-STANDARD) CLAUSE:
${benchmarkText}

Respond with JSON in this exact format:
{
  "riskLevel": "Standard" | "Caution" | "Unfavorable",
  "explanation": "A plain-language explanation of the key differences and their practical implications for the signing party. Keep it concise (2-4 sentences). Do not provide legal advice."
}

Guidelines:
- "Standard": The clause is materially similar to the benchmark or provides equivalent protections.
- "Caution": The clause has notable differences that could disadvantage one party but are not severe. Common in many contracts.
- "Unfavorable": The clause significantly deviates from market standard in ways that could seriously harm one party's interests.`;

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

/**
 * Batch evaluate multiple clauses against their market benchmarks in a single LLM call.
 * Avoids per-minute rate limit exhaustion and significantly speeds up analysis.
 */
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

  console.log(`[gemini] Evaluating semantic delta for batch of ${items.length} clauses in 1 call`);

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
    console.warn('[gemini] Batch evaluation failed, falling back to individual scoring:', (err as Error).message);
    for (const item of items) {
      const single = await evaluateSemanticDelta(item.clauseText, item.benchmarkText, item.clauseType);
      resultMap.set(item.clauseIndex, single);
    }
  }

  return resultMap;
}

/**
 * Generate a counter-draft for a flagged clause.
 * Grounded in the flagged clause + nearest benchmark.
 */
export async function generateCounterDraft(
  clauseText: string,
  benchmarkText: string,
  clauseType: string,
  riskLevel: RiskLevel,
  explanation: string
): Promise<CounterDraftResult> {
  console.log(`[gemini] Generating counter-draft for ${clauseType} (${riskLevel})`);

  const systemPrompt = `You are a contract drafting assistant that helps create fairer contract language. ${DISCLAIMER}

You generate alternative clause wording that addresses identified risks while remaining commercially reasonable for both parties. Base your suggestions on the market-standard benchmark provided. The counter-draft should be practical, balanced, and ready for a user to propose in negotiations.`;

  const userPrompt = `Generate a fairer alternative for this "${clauseType}" clause that has been flagged as "${riskLevel}".

CURRENT CLAUSE (FLAGGED):
${clauseText}

MARKET-STANDARD BENCHMARK:
${benchmarkText}

IDENTIFIED ISSUES:
${explanation}

Respond with JSON in this exact format:
{
  "counterDraft": "The full text of the proposed alternative clause, ready to copy-paste.",
  "explanation": "A brief explanation (2-3 sentences) of what was changed and why, in plain language."
}

Remember: This is for informational purposes only and should not be treated as legal advice. The user should consult a licensed attorney before using any suggested language in a binding agreement.`;

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

/**
 * Generate the "Before You Sign" gotchas summary for all flagged clauses.
 */
export async function generateGotchasSummary(
  flaggedClauses: Array<{
    clauseType: string;
    clauseText: string;
    riskLevel: RiskLevel;
    explanation: string;
    clauseIndex: number;
  }>
): Promise<GotchaItem[]> {
  if (flaggedClauses.length === 0) {
    return [];
  }

  console.log(`[gemini] Generating gotchas summary for ${flaggedClauses.length} flagged clauses`);

  const clauseSummaries = flaggedClauses
    .map((c, i) => `${i + 1}. [${c.riskLevel}] ${c.clauseType} (Clause #${c.clauseIndex + 1}): ${c.explanation}`)
    .join('\n');

  const systemPrompt = `You are a plain-language contract summary assistant. ${DISCLAIMER}

You create "Before You Sign" summaries that explain the practical, real-world implications of flagged contract clauses. Write for someone without legal training. Use clear, conversational language. Do not use legal jargon.`;

  const userPrompt = `Create a "Before You Sign" summary for these flagged clauses:

${clauseSummaries}

Respond with a JSON array of gotcha items:
[
  {
    "title": "Short, attention-grabbing title (e.g., 'You can't leave easily')",
    "explanation": "1-2 sentence plain-language explanation of the practical impact on the signer. Focus on real-world consequences.",
    "riskLevel": "Caution" or "Unfavorable",
    "relatedClauseIndex": <0-based index of the related clause in the original document>
  }
]

Keep each gotcha focused on ONE practical implication. Use the relatedClauseIndex values from the clause numbers provided (subtract 1 for 0-based indexing). This is informational only, not legal advice.`;

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
      explanation: 'The automated summary could not be generated. Please review all flagged clauses with a licensed attorney.',
      riskLevel: RiskLevel.Caution,
      relatedClauseIndex: 0,
    }];
  }
}

/**
 * LLM-based clause boundary detection fallback.
 * Used when regex-based splitting produces fewer than 3 clauses.
 */
export async function detectClauseBoundaries(
  documentText: string
): Promise<LLMClauseSplitResult[]> {
  console.log('[gemini] Using LLM fallback for clause boundary detection');

  const systemPrompt = `You are a document structure analyzer. Your task is to identify distinct clauses or sections in a legal contract and classify each one by type. Be thorough — identify ALL clauses in the document.`;

  const userPrompt = `Analyze this contract and identify each distinct clause or section. For each clause, provide the type and the exact text.

CONTRACT TEXT:
${documentText}

Respond with a JSON array:
[
  {
    "clauseType": "Payment Terms" | "Scope of Work" | "Intellectual Property" | "Confidentiality" | "Indemnification" | "Limitation of Liability" | "Termination" | "Dispute Resolution" | "Governing Law" | "Non-Compete/Non-Solicitation" | "Insurance" | "Amendments" | "Force Majeure" | "Warranty/Representations" | "Assignment" | "Notice" | "General",
    "clauseText": "The complete text of this clause, exactly as it appears in the document."
  }
]

Identify every distinct clause. If a section doesn't clearly fit a specific type, use "General".`;

  try {
    const text = await generateText(systemPrompt, userPrompt, 4096);
    return JSON.parse(text) as LLMClauseSplitResult[];
  } catch (err) {
    console.error('[gemini] Failed to parse clause boundary response:', (err as Error).message);
    return [];
  }
}

/** Reset the client — used for testing */
export function resetClient(): void {
  genAI = null;
}
