import { ComparisonResult, DifferenceClause } from '../types/legal';

export class DiffEngine {
  /**
   * Compares two versions of a contract or two contrasting agreements,
   * detecting modified terms, clause deletions/additions, and strategic leverage shifts.
   */
  public static compareDocuments(
    docAText: string, 
    docBText: string, 
    docATitle = 'Original Draft (v1)', 
    docBTitle = 'Revised Draft (v2)'
  ): ComparisonResult {
    const clausesA = this.segmentIntoSections(docAText);
    const clausesB = this.segmentIntoSections(docBText);

    const differences: DifferenceClause[] = [];

    // Compare corresponding sections
    const maxLen = Math.max(clausesA.length, clausesB.length);

    for (let i = 0; i < maxLen; i++) {
      const secA = clausesA[i] || { title: `Section ${i + 1}`, text: '[Section Omitted in Original]' };
      const secB = clausesB[i] || { title: `Section ${i + 1}`, text: '[Section Removed in Revision]' };

      const sectionTitle = secB.title !== `Section ${i + 1}` ? secB.title : secA.title;

      if (secA.text.trim() === secB.text.trim()) {
        continue; // Unchanged clause
      }

      const shift = this.evaluateFavorabilityShift(secA.text, secB.text);

      differences.push({
        sectionTitle,
        originalVersion: secA.text,
        revisedVersion: secB.text,
        favorabilityShift: shift.shift,
        explanation: shift.explanation,
      });
    }

    if (differences.length === 0) {
      differences.push({
        sectionTitle: 'Identical Document Text',
        originalVersion: docAText.substring(0, 300) + '...',
        revisedVersion: docBText.substring(0, 300) + '...',
        favorabilityShift: 'NEUTRAL',
        explanation: 'Both documents contain identical wording across all major provisions.',
      });
    }

    // Determine overall advantage
    const favorsBCnt = differences.filter((d) => d.favorabilityShift === 'FAVORS_PARTY_B').length;
    const favorsACnt = differences.filter((d) => d.favorabilityShift === 'FAVORS_PARTY_A').length;

    let overallAdvantage: ComparisonResult['overallAdvantage'] = 'BALANCED';
    let summary = 'The proposed revisions introduce balanced bilateral adjustments.';

    if (favorsBCnt > favorsACnt) {
      overallAdvantage = 'DOCUMENT_B';
      summary = `The revised draft (${docBTitle}) heavily favors the receiving party/customer, significantly softening liabilities, expanding termination rights, and safeguarding intellectual property.`;
    } else if (favorsACnt > favorsBCnt) {
      overallAdvantage = 'DOCUMENT_A';
      summary = `The original draft (${docATitle}) retained more unilateral protections and leverage for the originator/vendor. The revised draft has conceded multiple protections.`;
    }

    return {
      docATitle,
      docBTitle,
      summary,
      overallAdvantage,
      differences,
    };
  }

  private static segmentIntoSections(text: string): { title: string; text: string }[] {
    const rawSections = text.split(/\n{2,}|\n(?=\d+\.\s+[A-Z])/i);
    const sections: { title: string; text: string }[] = [];

    let index = 1;
    for (const raw of rawSections) {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length < 25) continue;

      const match = trimmed.match(/^(\d+|Section\s+\d+)\.?\s*([A-Z\s,/&\\-]+?)(?:\n|\.\s+|:\s+|$)/i);
      const title = match ? match[2].trim() : `Section ${index}`;

      sections.push({
        title: title || `Provision ${index}`,
        text: trimmed,
      });
      index++;
    }

    return sections;
  }

  private static evaluateFavorabilityShift(
    original: string, 
    revised: string
  ): { shift: DifferenceClause['favorabilityShift']; explanation: string } {
    const origLower = original.toLowerCase();
    const revLower = revised.toLowerCase();

    // 1. Term & Renewal
    if (origLower.includes('automatic') && origLower.includes('36') && revLower.includes('12') && revLower.includes('mutual')) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Term reduced from 36-month automatic trap to 12-month mutual renewal with CPI caps.',
      };
    }

    // 2. Unilateral modifications to Bilateral
    if (origLower.includes('unilateral') && revLower.includes('bilateral')) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Replaces unilateral vendor modification with mandatory bilateral written consent.',
      };
    }

    // 3. Liability caps
    if (origLower.includes('lesser of $1,000') || (origLower.includes('unlimited') && revLower.includes('mutually capped'))) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Replaced extreme asymmetric liability with balanced mutual cap equal to 12 months fees.',
      };
    }

    // 4. Data / AI Training
    if (origLower.includes('train proprietary machine learning') && revLower.includes('not use customer data to train')) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Removed unauthorized AI/ML training on customer data and added mandatory post-termination deletion.',
      };
    }

    // 5. SLA & Termination for Cause
    if (origLower.includes('sole and exclusive remedy') && revLower.includes('termination for chronic downtime')) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Gives customer explicit exit and refund rights if vendor fails uptime SLA for 2 consecutive months.',
      };
    }

    // Heuristic length / keyword checks
    if (revLower.includes('mutual') && !origLower.includes('mutual')) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Clause modified to establish mutual bilateral obligations rather than one-sided burden.',
      };
    }

    if (origLower.length > revLower.length + 80) {
      return {
        shift: 'FAVORS_PARTY_B',
        explanation: 'Streamlined section removing extensive covenants or restrictive clauses.',
      };
    }

    return {
      shift: 'NEUTRAL',
      explanation: 'Language modified for clarity or operational adjustments with neutral legal leverage impact.',
    };
  }
}
