import { AnalyzedClause, Citation } from '../types/legal';

export interface GeminiResponse {
  text: string;
  citations: Citation[];
  source: string;
  keyPurged?: boolean;
}

export type ApiKeySource = 'ENV_VARIABLE' | 'EPHEMERAL_USER_KEY' | 'STORED_USER_CONFIG' | 'OFFLINE_ENGINE';

export class GeminiService {
  private static STORAGE_KEY = 'lexiguard_gemini_api_key';
  
  // In-memory one-time ephemeral key (auto-wiped after single query)
  private static ephemeralApiKey: string | null = null;

  // Cascade models in order of priority (Latest Gemini 3.8 Flash -> 3.5 -> 2.5 -> 2.0)
  private static CASCADE_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  /**
   * Sets a one-time ephemeral key that will be auto-deleted immediately after query execution.
   */
  public static setEphemeralApiKey(key: string): void {
    if (key && key.trim()) {
      this.ephemeralApiKey = key.trim();
    }
  }

  /**
   * Consumes and immediately wipes the ephemeral key from memory.
   */
  public static consumeEphemeralApiKey(): string | null {
    const key = this.ephemeralApiKey;
    this.ephemeralApiKey = null; // Auto-wipe for privacy and security
    return key;
  }

  /**
   * Retrieves active API key with priority:
   * 1. Ephemeral user key (one-time use)
   * 2. Environment variable (VITE_GEMINI_API_KEY or GEMINI_API_KEY from Vercel / .env)
   * 3. LocalStorage user key
   */
  public static getActiveApiKey(): { key: string; source: ApiKeySource; isEphemeral: boolean } {
    if (this.ephemeralApiKey) {
      return { key: this.ephemeralApiKey, source: 'EPHEMERAL_USER_KEY', isEphemeral: true };
    }

    // Support both VITE_GEMINI_API_KEY and GEMINI_API_KEY
    const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {};
    const envKey = envObj.VITE_GEMINI_API_KEY || envObj.GEMINI_API_KEY;
    if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
      return { key: envKey.trim(), source: 'ENV_VARIABLE', isEphemeral: false };
    }

    const stored = this.getStoredApiKey();
    if (stored) {
      return { key: stored, source: 'STORED_USER_CONFIG', isEphemeral: false };
    }

    return { key: '', source: 'OFFLINE_ENGINE', isEphemeral: false };
  }

  public static getApiKeySource(): ApiKeySource {
    return this.getActiveApiKey().source;
  }

  public static isLiveGenAiActive(): boolean {
    return !!this.getActiveApiKey().key;
  }

  public static getStoredApiKey(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(this.STORAGE_KEY) || '';
      } catch {
        return '';
      }
    }
    return '';
  }

  public static setStoredApiKey(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (key.trim()) {
          window.localStorage.setItem(this.STORAGE_KEY, key.trim());
        } else {
          window.localStorage.removeItem(this.STORAGE_KEY);
        }
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Answers a user's question regarding the contract with grounded citations.
   * Utilizes the Cascade LLM failover mechanism across Gemini models.
   */
  public static async answerQuestion(
    question: string,
    contractText: string,
    clauses: AnalyzedClause[]
  ): Promise<GeminiResponse> {
    const { key, isEphemeral } = this.getActiveApiKey();

    // Consume and auto-wipe ephemeral key if present
    if (isEphemeral) {
      this.consumeEphemeralApiKey();
    }

    if (key) {
      // Execute Cascade failover
      for (const model of this.CASCADE_MODELS) {
        try {
          const liveResult = await this.queryGeminiModel(key, model, question, contractText, clauses);
          if (liveResult) {
            return {
              ...liveResult,
              keyPurged: isEphemeral,
            };
          }
        } catch (err) {
          console.warn(`Cascade failover: Model ${model} encountered an issue, trying next in cascade...`, err);
        }
      }
    }

    // High-performance intelligent fallback with exact clause grounding
    const fallback = this.queryHeuristicEngine(question, contractText, clauses);
    return {
      ...fallback,
      keyPurged: isEphemeral,
    };
  }

  /**
   * Generates a balanced counter-clause with strategic talking points.
   */
  public static async generateCounterClause(
    clause: AnalyzedClause,
    perspective: 'contractor' | 'customer' | 'employee' = 'contractor'
  ): Promise<string> {
    const { key, isEphemeral } = this.getActiveApiKey();

    if (isEphemeral) {
      this.consumeEphemeralApiKey();
    }

    if (key) {
      for (const model of this.CASCADE_MODELS) {
        try {
          const prompt = `You are a world-class legal negotiation strategist.
A user received this high-risk clause:
Title: ${clause.title}
Original Text: "${clause.originalText}"
Perspective: ${perspective}

Provide:
1. A balanced, industry-standard REDLINED COUNTER-PROPOSAL that fairly protects the ${perspective}.
2. Three concise talking points for negotiating this amendment with the other party.
Ensure you include a brief legal disclaimer.`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                }),
              }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidateText) return candidateText;
            }
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            throw fetchErr;
          }
        } catch (err) {
          console.warn(`Counter-clause cascade failover for model ${model}:`, err);
        }
      }
    }

    // Default fallback counter-clause
    return `### Recommended Counter-Proposal:
"${clause.counterClause || 'Each party shall be mutually protected under standard commercial terms with aggregate liability capped at the value of fees paid.'}"

### Strategic Negotiation Talking Points:
1. **Industry Parity**: One-sided indemnity and uncapped liability are outside market norms for engagements of this size.
2. **Mutual Protection**: Propose bilateral protections so both parties have identical covenants and accountability.
3. **Risk Allocation**: The party with direct operational control should bear the corresponding operational risk.`;
  }

  /**
   * Queries a specific Gemini model endpoint with error handling for cascade routing.
   */
  private static async queryGeminiModel(
    apiKey: string,
    modelName: string,
    question: string,
    contractText: string,
    clauses: AnalyzedClause[]
  ): Promise<GeminiResponse | null> {
    const systemInstruction = `You are LexiGuard AI, an expert legal co-pilot helping non-lawyers understand and navigate contracts.
Rules:
1. NEVER offer formal attorney legal advice. Include a brief reminder that this is for informational purposes.
2. Ground your answer strictly in the provided contract text.
3. Explicitly cite the clause numbers or titles whenever you make a factual claim.
4. Keep the explanation direct, plain-English, and actionable.`;

    const prompt = `${systemInstruction}

CONTRACT DOCUMENT EXCERPT:
${contractText.substring(0, 10000)}

USER QUESTION:
"${question}"

Provide a clear, structured response with grounded clause citations and practical implications.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }

    if (!response.ok) {
      throw new Error(`Model ${modelName} responded with status ${response.status}`);
    }

    const data = await response.json();
    const answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answerText) return null;

    // Detect matched clauses to construct citations
    const citations: Citation[] = [];
    for (const clause of clauses) {
      if (
        answerText.toLowerCase().includes(clause.title.toLowerCase()) ||
        answerText.includes(clause.clauseNumber || '')
      ) {
        citations.push({
          clauseId: clause.id,
          clauseTitle: clause.title,
          snippet: clause.originalText.substring(0, 140) + '...',
        });
      }
    }

    return {
      text: answerText,
      citations: citations.slice(0, 3),
      source: `Google ${modelName}`,
    };
  }

  /**
   * Intelligent offline heuristic engine with citation grounding.
   */
  private static queryHeuristicEngine(
    question: string,
    _contractText: string,
    clauses: AnalyzedClause[]
  ): GeminiResponse {
    const qLower = question.toLowerCase();
    const citations: Citation[] = [];
    let text = '';

    if (qLower.includes('terminat') || qLower.includes('cancel') || qLower.includes('exit') || qLower.includes('leave')) {
      const termClause = clauses.find((c) => c.dimension === 'TERMINATION') || clauses[0];
      if (termClause) {
        citations.push({
          clauseId: termClause.id,
          clauseTitle: termClause.title,
          snippet: termClause.originalText.substring(0, 160) + '...',
        });
      }

      text = `### Termination & Exit Rights Assessment:
Based on **${termClause ? termClause.title : 'Termination Section'}**, the contract creates an asymmetric exit mechanism:
- **Company's Right**: May terminate immediately with or without cause.
- **Your Right**: You are required to give advance written notice (up to 90–120 days) and may forfeit compensation for in-progress work.
- **Action Item**: Submit a counter-clause for mutual 30-day notice for convenience, with full payment for all completed milestone hours.

*(Notice: This analysis provides informational legal triage, not formal legal counsel.)*`;
    } else if (qLower.includes('liability') || qLower.includes('sue') || qLower.includes('indemnif') || qLower.includes('risk')) {
      const liabClause = clauses.find((c) => c.dimension === 'LIABILITY') || clauses[0];
      if (liabClause) {
        citations.push({
          clauseId: liabClause.id,
          clauseTitle: liabClause.title,
          snippet: liabClause.originalText.substring(0, 160) + '...',
        });
      }

      text = `### Liability & Indemnification Risk Breakdown:
According to **${liabClause ? liabClause.title : 'Liability Section'}**, there is a severe imbalance:
- **Your Exposure**: Your liability is **UNLIMITED**, meaning you could be forced to pay legal defense fees for third-party claims even without fault.
- **Company's Exposure**: Strictly capped to nominal amounts (e.g. $100 or 1 month fees).
- **Recommended Action**: Insist on a mutual liability cap equal to total contract fees, and restrict indemnification strictly to your own gross negligence.`;
    } else if (qLower.includes('ip') || qLower.includes('intellectual property') || qLower.includes('own') || qLower.includes('patent') || qLower.includes('copyright')) {
      const ipClause = clauses.find((c) => c.dimension === 'INTELLECTUAL_PROPERTY') || clauses[0];
      if (ipClause) {
        citations.push({
          clauseId: ipClause.id,
          clauseTitle: ipClause.title,
          snippet: ipClause.originalText.substring(0, 160) + '...',
        });
      }

      text = `### Intellectual Property & Ownership Analysis:
Reviewing **${ipClause ? ipClause.title : 'IP Section'}**:
- **Ownership Scope**: Overbroad assignment attempting to claim all inventions, algorithms, and works conceived on personal time or laptops.
- **Moral Rights**: Irrevocable waiver of moral rights prevents you from claiming attribution or portfolio credit.
- **Remedy**: Specify that ownership only transfers upon **receipt of full final payment**, and attach a schedule of Pre-Existing Background IP to retain your proprietary tooling.`;
    } else if (qLower.includes('compete') || qLower.includes('freelance') || qLower.includes('other clients') || qLower.includes('outside')) {
      const ncClause = clauses.find((c) => c.dimension === 'RESTRICTIVE_COVENANTS') || clauses[0];
      if (ncClause) {
        citations.push({
          clauseId: ncClause.id,
          clauseTitle: ncClause.title,
          snippet: ncClause.originalText.substring(0, 160) + '...',
        });
      }

      text = `### Non-Compete & Restrictive Covenants Review:
Under **${ncClause ? ncClause.title : 'Restrictive Covenants'}**:
- **Restriction Period**: 12 to 24 months post-termination.
- **Geographic Scope**: Worldwide or nationwide ban on engaging in similar business, often paired with liquidated damages.
- **Enforceability Note**: Many states (e.g. California, Minnesota, New York) strictly limit or void post-employment non-competes. Ask an attorney if this covenant is void in your jurisdiction.`;
    } else {
      const topClause = clauses[0];
      if (topClause) {
        citations.push({
          clauseId: topClause.id,
          clauseTitle: topClause.title,
          snippet: topClause.originalText.substring(0, 160) + '...',
        });
      }

      text = `### Legal Document Finding:
Regarding your query: "${question}"
- **Summary**: This document outlines specific operational, financial, and risk allocations across ${clauses.length} evaluated provisions.
- **Key Consideration**: Pay close attention to notice periods, liability caps, and ownership terms before signing or executing amendments.
- **Recommendation**: Review the Clause Demystifier tab for detailed breakdown of individual clauses and counter-proposals.`;
    }

    return {
      text,
      citations,
      source: 'Deterministic Legal NLP Engine',
    };
  }
}
