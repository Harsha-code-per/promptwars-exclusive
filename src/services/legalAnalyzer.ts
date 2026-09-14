import { 
  ContractAnalysis, 
  AnalyzedClause, 
  DimensionScore, 
  LegalDimension, 
  RiskLevel, 
  KeyTimeline, 
  ActionItem,
  AttorneyBrief 
} from '../types/legal';

export class LegalAnalyzer {
  /**
   * Analyzes raw contract text using legal heuristics, clause segmenting,
   * risk taxonomies, and statutory benchmark knowledge.
   */
  public static analyzeContract(rawText: string, title = 'Uploaded Legal Document'): ContractAnalysis {
    const clauses = this.extractAndAnalyzeClauses(rawText);
    const dimensionScores = this.calculateDimensionScores(clauses);
    const overallScore = this.calculateOverallHealthScore(dimensionScores);
    const overallRating = this.getRatingFromScore(overallScore);
    const timelines = this.extractTimelines(rawText, clauses);
    const checklist = this.generateActionChecklist(clauses, overallRating);
    const attorneyBrief = this.generateAttorneyBrief(clauses, overallScore);
    const executiveSummary = this.generateExecutiveSummary(title, overallScore, overallRating, clauses);

    return {
      documentTitle: title,
      overallScore,
      overallRating,
      executiveSummary,
      dimensionScores,
      clauses,
      timelines,
      checklist,
      attorneyBrief,
      piiRedacted: false,
      analyzedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  /**
   * Segments text into distinct clauses and performs deep risk & plain-English analysis.
   */
  private static extractAndAnalyzeClauses(text: string): AnalyzedClause[] {
    const rawParagraphs = text.split(/\n{2,}|\n(?=\d+\.\s+[A-Z])|\n(?=Section\s+\d+)/i);
    const analyzedClauses: AnalyzedClause[] = [];

    let clauseIndex = 1;

    for (const paragraph of rawParagraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed || trimmed.length < 35) continue;

      // Extract clause title or number if present
      const matchNumber = trimmed.match(/^(\d+|Section\s+\d+)\.?\s*([A-Z\s,/&\\-]+?)(?:\n|\.\s+|:\s+|$)/i);
      let title = matchNumber ? matchNumber[2].trim() : `Clause ${clauseIndex}`;
      if (title.length > 50) title = title.substring(0, 50) + '...';

      const dimension = this.detectDimension(trimmed);
      const riskInfo = this.evaluateRisk(trimmed, dimension);
      
      analyzedClauses.push({
        id: `clause-${clauseIndex}`,
        clauseNumber: matchNumber ? matchNumber[1] : `${clauseIndex}`,
        title: title || `Provision ${clauseIndex}`,
        originalText: trimmed,
        plainEnglish: riskInfo.plainEnglish,
        riskLevel: riskInfo.level,
        dimension,
        implications: riskInfo.implications,
        counterClause: riskInfo.counterClause,
        statutoryReference: riskInfo.statutoryReference,
      });

      clauseIndex++;
    }

    if (analyzedClauses.length === 0) {
      // Fallback if text couldn't be cleanly segmented
      const dimension = this.detectDimension(text);
      const riskInfo = this.evaluateRisk(text, dimension);
      analyzedClauses.push({
        id: 'clause-1',
        clauseNumber: '1',
        title: 'Full Agreement Review',
        originalText: text,
        plainEnglish: riskInfo.plainEnglish,
        riskLevel: riskInfo.level,
        dimension,
        implications: riskInfo.implications,
        counterClause: riskInfo.counterClause,
        statutoryReference: riskInfo.statutoryReference,
      });
    }

    return analyzedClauses;
  }

  /**
   * Classifies which core legal dimension a clause addresses.
   */
  private static detectDimension(text: string): LegalDimension {
    const lower = text.toLowerCase();

    if (
      lower.includes('indemnif') || 
      lower.includes('hold harmless') || 
      lower.includes('limitation of liability') || 
      lower.includes('damages') ||
      lower.includes('warrant')
    ) {
      return 'LIABILITY';
    }

    if (
      lower.includes('intellectual property') || 
      lower.includes('patent') || 
      lower.includes('copyright') || 
      lower.includes('moral rights') || 
      lower.includes('invention') ||
      lower.includes('works of authorship') ||
      lower.includes('confidential')
    ) {
      return 'INTELLECTUAL_PROPERTY';
    }

    if (
      lower.includes('terminat') || 
      lower.includes('renewal') || 
      lower.includes('expire') || 
      lower.includes('notice period') ||
      lower.includes('cure period')
    ) {
      return 'TERMINATION';
    }

    if (
      lower.includes('non-compete') || 
      lower.includes('non-solicit') || 
      lower.includes('covenant') || 
      lower.includes('exclusive') || 
      lower.includes('outside consulting')
    ) {
      return 'RESTRICTIVE_COVENANTS';
    }

    return 'DISPUTE_RESOLUTION';
  }

  /**
   * Risk engine evaluating severity, plain-English breakdown, and negotiation counter-clauses.
   */
  private static evaluateRisk(
    text: string, 
    _dimension: LegalDimension
  ): { 
    level: RiskLevel; 
    plainEnglish: string; 
    implications: string; 
    counterClause?: string;
    statutoryReference?: string;
  } {
    const lower = text.toLowerCase();

    // 1. Predatory Unlimited Liability & One-Sided Indemnity
    if (
      (lower.includes('indemnif') && lower.includes('regardless of')) ||
      (lower.includes('unlimited') && lower.includes('liability')) ||
      (lower.includes('sole discretion') && lower.includes('withhold payment'))
    ) {
      return {
        level: 'CRITICAL',
        plainEnglish: 'You are forced to take on 100% of all legal risks, lawsuits, and legal fees—even if someone else made the mistake. Meanwhile, their liability is capped to almost nothing.',
        implications: 'If a client or third party files a lawsuit regarding this project, you could be personally liable for tens of thousands of dollars in legal defense costs, effectively risking bankruptcy.',
        counterClause: 'Each party shall defend and indemnify the other against third-party claims arising solely from its own gross negligence or willful misconduct, with aggregate liability capped at total fees paid in the prior 12 months.',
        statutoryReference: 'UCC § 2-719 (Unconscionable Limitation of Remedy) & Restatement (Second) of Contracts § 208.',
      };
    }

    // 2. Overbroad Inventions & Moral Rights Grab
    if (
      lower.includes('moral rights') ||
      (lower.includes('personal time') && lower.includes('assign')) ||
      (lower.includes('throughout the universe') && lower.includes('perpetuity'))
    ) {
      return {
        level: 'CRITICAL',
        plainEnglish: 'They claim total ownership over everything you create—even hobby projects, side businesses, or ideas developed on your own laptop outside work hours. You also surrender moral rights forever.',
        implications: 'You cannot showcase your own work in your portfolio, reuse your own custom utility scripts, or build future software that overlaps with this field.',
        counterClause: 'Contractor retains sole ownership of all pre-existing tools and background IP. Contractor assigns only the specific bespoke deliverables created exclusively for Company upon receipt of full payment.',
        statutoryReference: 'Cal. Lab. Code § 2870 (Invention Assignment Protection) & 17 U.S. Code § 106A (Visual Artists Rights Act).',
      };
    }

    // 3. Overbroad Non-Competes & Restrictive Covenants
    if (lower.includes('non-compete') || lower.includes('liquidated damages')) {
      const isExtreme = lower.includes('worldwide') || lower.includes('united states') || lower.includes('24 months') || lower.includes('liquidated damages');
      return {
        level: isExtreme ? 'CRITICAL' : 'HIGH',
        plainEnglish: `You are forbidden from working for any competitor or freelancing in your field for up to 2 years across massive geographic territories, under threat of hefty financial penalties.`,
        implications: 'This restricts your fundamental right to earn a living in your area of expertise. In many jurisdictions, such broad non-competes are legally void, but fighting them in court is stressful and expensive.',
        counterClause: 'Contractor agrees solely to refrain from soliciting Company\'s direct active clients for a period not to exceed six (6) months, with all general non-compete restrictions removed.',
        statutoryReference: 'FTC Final Rule on Non-Competes (16 CFR Part 910) & Cal. Bus. & Prof. Code § 16600.',
      };
    }

    // 4. Auto-Renewal Traps & Sudden Price Hikes
    if (lower.includes('automatically renew') || lower.includes('90 days prior') || lower.includes('increase subscription')) {
      return {
        level: 'HIGH',
        plainEnglish: 'The contract locks you into multi-year recurring obligations automatically unless you send cancellation notice months in advance, and allows them to increase prices unilaterally.',
        implications: 'Missing a narrow cancellation calendar window locks your business into an unwanted 3-year commitment at higher rates.',
        counterClause: 'Agreement shall only renew upon mutual written agreement, or non-renewal notice may be provided at any time up to thirty (30) days prior to the expiration of the current term with price caps indexed to CPI.',
        statutoryReference: 'FTC "Click-to-Cancel" Rule & State Automatic Renewal Laws (e.g., Cal. Bus. & Prof. Code § 17600).',
      };
    }

    // 5. Unilateral Termination or Modification
    if (lower.includes('forfeit') || lower.includes('without additional fee') || (lower.includes('120') && lower.includes('notice'))) {
      return {
        level: 'CRITICAL',
        plainEnglish: 'They can fire you on the spot without cause and legally confiscate your pay for work you already completed. Meanwhile, you must give 120 days notice and provide unpaid labor.',
        implications: 'Extreme financial penalty and uncompensated labor trap. In many jurisdictions, clauses causing forfeiture of earned wages are unenforceable.',
        counterClause: 'Either party may terminate for convenience upon thirty (30) days written notice. Company shall immediately pay Contractor for all services performed and non-cancelable expenses incurred up to termination.',
        statutoryReference: 'Unconscionable Forfeiture Doctrine & Restatement (Second) of Contracts § 229.',
      };
    }

    if (lower.includes('unilateral') || (lower.includes('terminate immediately') && lower.includes('sole discretion'))) {
      return {
        level: 'HIGH',
        plainEnglish: 'They can cancel the contract whenever they want without paying for ongoing work, but you are locked in with long notice periods and heavy transfer duties.',
        implications: 'Creates severe cash flow uncertainty; your project could be terminated mid-stream without payment for hours already invested.',
        counterClause: 'Either party may terminate for convenience upon thirty (30) days written notice. In such event, Company shall pay Contractor for all services performed and non-cancelable expenses incurred up to the termination date.',
        statutoryReference: 'Implied Covenant of Good Faith and Fair Dealing (Restatement § 205).',
      };
    }

    // 6. Unilateral Arbitration & Distant Venue
    if (lower.includes('arbitration') && (lower.includes('delaware') || lower.includes('class action'))) {
      return {
        level: 'MEDIUM',
        plainEnglish: 'All legal fights must be handled through private arbitration in another state (e.g. Delaware), stripping away jury rights and class action protections, while you must pay their legal fees.',
        implications: 'Out-of-state arbitration is cost-prohibitive for individuals or small businesses, effectively denying access to legal justice.',
        counterClause: 'Disputes shall be governed by the laws and courts of the defendant\'s principal place of business, with each party bearing its own legal fees.',
        statutoryReference: 'Federal Arbitration Act (9 U.S.C. § 2) & Judicial Unconscionability Standards.',
      };
    }

    // 7. Standard Confidentiality / Balanced Terms
    if (lower.includes('confidential') || lower.includes('standard') || lower.includes('reasonable precautions')) {
      return {
        level: 'LOW',
        plainEnglish: 'Standard commercial protection requiring both parties to safeguard secret business information with standard exclusions for public knowledge.',
        implications: 'Fair and standard commercial practice; ensures sensitive company or technical data is not leaked without permission.',
        counterClause: 'Current wording is balanced and adheres to market standard practice.',
        statutoryReference: 'Defend Trade Secrets Act (18 U.S.C. § 1836) & Uniform Trade Secrets Act (UTSA).',
      };
    }

    // Default Balanced Assessment
    return {
      level: 'LOW',
      plainEnglish: 'Standard operational clause defining roles, deliverables, or administrative governance.',
      implications: 'Low risk under standard commercial operating conditions.',
      counterClause: 'Clause appears standard and commercially reasonable.',
    };
  }

  /**
   * Computes individual health scores across the 5 dimensions.
   */
  private static calculateDimensionScores(clauses: AnalyzedClause[]): Record<LegalDimension, DimensionScore> {
    const dimensions: LegalDimension[] = [
      'LIABILITY',
      'INTELLECTUAL_PROPERTY',
      'TERMINATION',
      'RESTRICTIVE_COVENANTS',
      'DISPUTE_RESOLUTION',
    ];

    const labels: Record<LegalDimension, string> = {
      LIABILITY: 'Liability & Indemnification',
      INTELLECTUAL_PROPERTY: 'IP & Ownership Rights',
      TERMINATION: 'Termination & Exit Traps',
      RESTRICTIVE_COVENANTS: 'Restrictive Covenants & Non-Competes',
      DISPUTE_RESOLUTION: 'Dispute Resolution & Jurisdiction',
    };

    const result: Partial<Record<LegalDimension, DimensionScore>> = {};

    for (const dim of dimensions) {
      const dimClauses = clauses.filter((c) => c.dimension === dim);
      let score = 88; // default healthy baseline
      let criticalCount = 0;
      let highCount = 0;

      for (const clause of dimClauses) {
        if (clause.riskLevel === 'CRITICAL') {
          score -= 32;
          criticalCount++;
        } else if (clause.riskLevel === 'HIGH') {
          score -= 18;
          highCount++;
        } else if (clause.riskLevel === 'MEDIUM') {
          score -= 8;
        } else if (clause.riskLevel === 'FAVORABLE') {
          score += 5;
        }
      }

      if (criticalCount > 0) {
        score = Math.max(10, Math.min(30, 40 - criticalCount * 10));
      } else if (highCount > 0) {
        score = Math.max(25, Math.min(55, score));
      } else {
        score = Math.max(40, Math.min(100, score));
      }

      let riskLevel: RiskLevel = 'LOW';
      if (score < 40 || criticalCount > 0) riskLevel = 'CRITICAL';
      else if (score < 60 || highCount > 0) riskLevel = 'HIGH';
      else if (score < 75) riskLevel = 'MEDIUM';

      let summary = 'Well balanced with standard commercial protections.';
      if (riskLevel === 'CRITICAL') {
        summary = 'Severe contractual exposure. Extreme one-sided terms detected.';
      } else if (riskLevel === 'HIGH') {
        summary = 'Elevated risk. Ambiguous or vendor-tilted clauses present.';
      } else if (riskLevel === 'MEDIUM') {
        summary = 'Moderate friction points. Renegotiation recommended before signing.';
      }

      result[dim] = {
        dimension: dim,
        label: labels[dim],
        score,
        riskLevel,
        riskCount: criticalCount + highCount,
        summary,
      };
    }

    return result as Record<LegalDimension, DimensionScore>;
  }

  /**
   * Calculates overall composite legal health score (0-100).
   */
  private static calculateOverallHealthScore(scores: Record<LegalDimension, DimensionScore>): number {
    const weights: Record<LegalDimension, number> = {
      LIABILITY: 0.30,
      INTELLECTUAL_PROPERTY: 0.25,
      TERMINATION: 0.20,
      RESTRICTIVE_COVENANTS: 0.15,
      DISPUTE_RESOLUTION: 0.10,
    };

    let composite = 0;
    let criticalDims = 0;
    for (const dim of Object.keys(weights) as LegalDimension[]) {
      composite += scores[dim].score * weights[dim];
      if (scores[dim].riskLevel === 'CRITICAL') criticalDims++;
    }

    if (criticalDims >= 3) {
      composite = Math.min(composite, 32);
    } else if (criticalDims >= 1) {
      composite = Math.min(composite, 44);
    }

    return Math.round(composite);
  }

  private static getRatingFromScore(score: number): ContractAnalysis['overallRating'] {
    if (score < 40) return 'CRITICAL_RISK';
    if (score < 65) return 'HIGH_RISK';
    if (score < 80) return 'MODERATE_RISK';
    return 'BALANCED_AND_SAFE';
  }

  /**
   * Extracts critical deadlines and notice periods from text.
   */
  private static extractTimelines(text: string, _clauses: AnalyzedClause[]): KeyTimeline[] {
    const timelines: KeyTimeline[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('net-90')) {
      timelines.push({
        event: 'Payment Settlement',
        timeline: 'Net-90 Days after formal acceptance',
        consequence: 'Extreme delay in cash flow; 3 months wait for earned compensation.',
      });
    }

    if (lower.includes('120') && lower.includes('notice')) {
      timelines.push({
        event: 'Contractor Exit Notice',
        timeline: '120 Days advance written notice',
        consequence: 'Contractual lock-in; must continue working and training replacement for 4 months.',
      });
    }

    if (lower.includes('90 days prior') || (lower.includes('renew') && lower.includes('90'))) {
      timelines.push({
        event: 'Non-Renewal Opt-Out Window',
        timeline: 'At least 90 days before annual/triennial expiration',
        consequence: 'Failure to notify triggers immediate automatic lock-in for next term.',
      });
    }

    if (lower.includes('24') && lower.includes('month')) {
      timelines.push({
        event: 'Post-Termination Restrictive Period',
        timeline: '24 Months following contract end',
        consequence: 'Prohibits competitive work or talent solicitation for 2 full years.',
      });
    }

    if (lower.includes('two (2) years') || lower.includes('2 years')) {
      timelines.push({
        event: 'Confidentiality Survival Term',
        timeline: '2 Years post-disclosure',
        consequence: 'Commercially standard term for proprietary information protection.',
      });
    }

    if (timelines.length === 0) {
      timelines.push({
        event: 'Standard Term & Expiration',
        timeline: '30 Days written notice for termination',
        consequence: 'Standard commercial termination notice period.',
      });
    }

    return timelines;
  }

  /**
   * Generates tailored checklist of actions.
   */
  private static generateActionChecklist(clauses: AnalyzedClause[], rating: string): ActionItem[] {
    const list: ActionItem[] = [];

    if (rating === 'CRITICAL_RISK' || rating === 'HIGH_RISK') {
      list.push({
        id: 'act-1',
        task: 'Do not sign in current form. Submit redlined counter-proposals for liability and IP clauses.',
        priority: 'HIGH',
        category: 'Negotiation Strategy',
      });
      list.push({
        id: 'act-2',
        task: 'Cap liability at total contract value (or 12 months fees) and require bilateral indemnification.',
        priority: 'HIGH',
        category: 'Liability Protection',
      });
    }

    const hasNonCompete = clauses.some((c) => c.dimension === 'RESTRICTIVE_COVENANTS' && c.riskLevel === 'CRITICAL');
    if (hasNonCompete) {
      list.push({
        id: 'act-3',
        task: 'Strike out the worldwide non-compete clause or limit strictly to direct solicitation of active clients.',
        priority: 'HIGH',
        category: 'Restrictive Covenants',
      });
    }

    list.push({
      id: 'act-4',
      task: 'Set calendar reminders for non-renewal windows and milestone delivery acceptance deadlines.',
      priority: 'MEDIUM',
      category: 'Calendar Tracking',
    });

    list.push({
      id: 'act-5',
      task: 'Prepare executive dossier and schedule consultation with specialized legal counsel.',
      priority: 'MEDIUM',
      category: 'Legal Counsel',
    });

    return list;
  }

  /**
   * Generates attorney briefing points and questions for counsel.
   */
  private static generateAttorneyBrief(clauses: AnalyzedClause[], _score: number): AttorneyBrief {
    const criticalClauses = clauses.filter((c) => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH');

    const topRedFlags = criticalClauses.slice(0, 4).map((c) => `${c.title}: ${c.implications}`);
    if (topRedFlags.length === 0) {
      topRedFlags.push('Document appears reasonably balanced; primary check is verification of governing law and formal definitions.');
    }

    const questionsForCounsel = [
      'Is the proposed limitation of liability and indemnification structure enforceable and commercially customary for our deal size?',
      'Does the intellectual property assignment clause overreach into pre-existing background IP or outside personal hobby projects under applicable state law?',
      'Are the post-termination restrictive covenants and non-compete clauses enforceable under current FTC guidelines and local state labor statutes?',
      'What specific carve-outs should we insert into the unilateral termination and auto-renewal sections to protect operational continuity?',
      'If dispute resolution requires out-of-state binding arbitration, what would our estimated minimum cost be to defend a claim?',
    ];

    const negotiationPriorities = [
      'Priority 1: Strike uncapped indemnification and replace with mutual cap equal to 12 months fees.',
      'Priority 2: Carve out background tools, open-source libraries, and personal IP from assignment.',
      'Priority 3: Reduce exit notice period from 90/120 days to mutual 30 days written notice.',
      'Priority 4: Remove liquidated damages penalty clauses and clarify objective acceptance criteria.',
    ];

    const suggestedAddendums = [
      'Mutual Limitation of Liability Addendum (Standard Cap)',
      'Pre-Existing Background Intellectual Property Reservation Schedule',
      'Bilateral Good Faith Termination & Milestone Acceptance Rider',
    ];

    return {
      topRedFlags,
      questionsForCounsel,
      negotiationPriorities,
      suggestedAddendums,
    };
  }

  /**
   * Generates executive summary text.
   */
  private static generateExecutiveSummary(
    title: string, 
    score: number, 
    rating: string, 
    clauses: AnalyzedClause[]
  ): string {
    const criticalCount = clauses.filter((c) => c.riskLevel === 'CRITICAL').length;
    const highCount = clauses.filter((c) => c.riskLevel === 'HIGH').length;

    if (rating === 'CRITICAL_RISK') {
      return `"${title}" scores an alarming ${score}/100 on the LexiGuard Legal Health Index. The agreement contains ${criticalCount} critical hazard provisions, notably regarding unlimited unilateral liability, aggressive intellectual property forfeiture, and extreme non-compete penalties. Signing this contract in its current format places significant legal and financial exposure onto you. Immediate renegotiation or formal legal counsel review is strongly advised.`;
    }

    if (rating === 'HIGH_RISK') {
      return `"${title}" has received an elevated risk score of ${score}/100. While some operational provisions are standard, ${highCount} high-risk clauses were flagged—primarily around long auto-renewal lock-ins, unilateral modification rights, or asymmetric termination terms. Redlines should be submitted to balance these provisions.`;
    }

    if (rating === 'MODERATE_RISK') {
      return `"${title}" demonstrates a moderate legal health rating of ${score}/100. Key terms are generally functional, but minor ambiguities in dispute venue, restrictive covenants, or payment terms warrant tightening before execution.`;
    }

    return `"${title}" scores a healthy ${score}/100 on the LexiGuard Legal Health Index. The provisions are bilateral, commercially reasonable, and adhere closely to market standards for mutual confidentiality and fair commercial engagement.`;
  }
}
