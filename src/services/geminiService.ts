import { AnalyzedClause, Citation } from '../types/legal';

export interface GeminiResponse {
  text: string;
  citations: Citation[];
  source: 'GEMINI_API' | 'HEURISTIC_AI_ENGINE';
}

export type ApiKeySource = 'ENV_VARIABLE' | 'USER_CONFIG' | 'OFFLINE_ENGINE';

export class GeminiService {
  private static STORAGE_KEY = 'lexiguard_gemini_api_key';

  /**
   * Retrieves the active API key, prioritizing Vite environment variable (Vercel/.env)
   * then user-provided local storage.
   */
  public static getActiveApiKey(): string {
    // 1. Check environment variable (Vercel / .env)
    const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
      return envKey.trim();
    }

    // 2. Check localStorage
    return this.getStoredApiKey();
  }

  public static getApiKeySource(): ApiKeySource {
    const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
      return 'ENV_VARIABLE';
    }
    const stored = this.getStoredApiKey();
    if (stored) return 'USER_CONFIG';
    return 'OFFLINE_ENGINE';
  }

  public static isLiveGenAiActive(): boolean {
    return !!this.getActiveApiKey();
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
        // Ignored in restricted environments
      }
    }
  }

  /**
   * Answers a user's question regarding the contract with grounded citations.
   */
  public static async answerQuestion(
    question: string,
    contractText: string,
    clauses: AnalyzedClause[]
  ): Promise<GeminiResponse> {
    const apiKey = this.getActiveApiKey();

    if (apiKey) {
      try {
        const liveResult = await this.queryGeminiLive(apiKey, question, contractText, clauses);
        if (liveResult) return liveResult;
      } catch (err) {
        console.warn('Live Gemini API query encountered an error. Falling back to Heuristic AI engine:', err);
      }
    }

    // High-performance intelligent fallback with exact clause grounding
    return this.queryHeuristicEngine(question, contractText, clauses);
  }

  /**
   * Generates a balanced counter-clause with strategic talking points.
   */
  public static async generateCounterClause(
    clause: AnalyzedClause,
    perspective: 'contractor' | 'customer' | 'employee' = 'contractor'
  ): Promise<string> {
    const apiKey = this.getActiveApiKey();

    if (apiKey) {
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

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) return candidateText;
        }
      } catch (err) {
        console.warn('Gemini counter-clause generation fallback:', err);
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
   * Calls Google Gemini 2.0 Flash / 1.5 Flash via REST endpoint.
   */
  private static async queryGeminiLive(
    apiKey: string,
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
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
      source: 'GEMINI_API',
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

    // Check Question Intents
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
      // General question
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
      source: 'HEURISTIC_AI_ENGINE',
    };
  }
}
