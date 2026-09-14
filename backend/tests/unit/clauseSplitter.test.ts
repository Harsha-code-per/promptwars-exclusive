import { splitClauses, classifyHeading, MIN_CLAUSE_THRESHOLD } from '../../src/modules/ingestion/clauseSplitter';
import { ClauseType } from '../../src/types';
import fs from 'fs';
import path from 'path';

describe('Clause Splitter', () => {
  describe('splitClauses', () => {
    it('should split a well-structured contract into clauses by numbered sections', () => {
      const text = `1. Payment Terms

Client shall pay Contractor within 30 days of receiving a valid invoice.
Late payments accrue interest at 1.5% per month.

2. Scope of Work

Contractor shall perform the services described in the SOW.
Any work beyond scope requires a written change order.

3. Termination

Either party may terminate with 30 days written notice.`;

      const clauses = splitClauses(text);

      expect(clauses.length).toBe(3);
      expect(clauses[0].clauseType).toBe(ClauseType.PaymentTerms);
      expect(clauses[1].clauseType).toBe(ClauseType.ScopeOfWork);
      expect(clauses[2].clauseType).toBe(ClauseType.Termination);
    });

    it('should split clauses with "Section" prefix headings', () => {
      const text = `Section 1. Indemnification

Each party shall indemnify the other from third-party claims.

Section 2. Governing Law

This Agreement shall be governed by the laws of California.

Section 3. Force Majeure

Neither party shall be liable for delays beyond reasonable control.`;

      const clauses = splitClauses(text);

      expect(clauses.length).toBe(3);
      expect(clauses[0].clauseType).toBe(ClauseType.Indemnification);
      expect(clauses[1].clauseType).toBe(ClauseType.GoverningLaw);
      expect(clauses[2].clauseType).toBe(ClauseType.ForceMajeure);
    });

    it('should split clauses with ALL-CAPS headings', () => {
      const text = `CONFIDENTIALITY

Both parties agree to maintain confidentiality of shared information.

LIMITATION OF LIABILITY

Neither party shall be liable for indirect damages.

DISPUTE RESOLUTION

Disputes shall be resolved through arbitration.`;

      const clauses = splitClauses(text);

      expect(clauses.length).toBe(3);
      expect(clauses[0].clauseType).toBe(ClauseType.Confidentiality);
      expect(clauses[1].clauseType).toBe(ClauseType.LimitationOfLiability);
      expect(clauses[2].clauseType).toBe(ClauseType.DisputeResolution);
    });

    it('should split the sample freelance contract fixture', () => {
      const fixturePath = path.join(__dirname, '../fixtures/sample-freelance-contract.txt');
      const text = fs.readFileSync(fixturePath, 'utf-8');

      const clauses = splitClauses(text);

      // Should find many clauses (the fixture has 15 numbered sections)
      expect(clauses.length).toBeGreaterThanOrEqual(10);

      // Check that common clause types are identified
      const types = clauses.map((c) => c.clauseType);
      expect(types).toContain(ClauseType.PaymentTerms);
      expect(types).toContain(ClauseType.Termination);
      expect(types).toContain(ClauseType.Indemnification);
    });

    it('should return the whole document as General when no headings found', () => {
      const text = 'This is a plain text document without any section headings or structure. It just contains some legal-sounding text about obligations and responsibilities.';

      const clauses = splitClauses(text);

      expect(clauses.length).toBe(1);
      expect(clauses[0].clauseType).toBe(ClauseType.General);
      expect(clauses[0].clauseText).toContain('plain text document');
    });

    it('should handle Title Case headings followed by period', () => {
      const text = `Payment Terms. Client shall pay within 30 days.
Additional payment details here.

Intellectual Property. All work product is assigned to Client upon full payment.
More IP details.

Termination. Either party may terminate with notice.`;

      const clauses = splitClauses(text);

      expect(clauses.length).toBeGreaterThanOrEqual(3);
    });

    it('should skip trivially short sections (< 20 chars)', () => {
      const text = `1. Title

ok

2. Indemnification

Each party shall indemnify and hold harmless the other from claims.

3. Short

yes`;

      const clauses = splitClauses(text);

      // Should have Indemnification but may skip trivially short ones
      const indemnClauses = clauses.filter((c) => c.clauseType === ClauseType.Indemnification);
      expect(indemnClauses.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('classifyHeading', () => {
    it('should classify payment-related headings', () => {
      expect(classifyHeading('Payment Terms')).toBe(ClauseType.PaymentTerms);
      expect(classifyHeading('COMPENSATION')).toBe(ClauseType.PaymentTerms);
      expect(classifyHeading('Fees and Payment')).toBe(ClauseType.PaymentTerms);
      expect(classifyHeading('Rent Payment')).toBe(ClauseType.PaymentTerms);
    });

    it('should classify indemnification headings', () => {
      expect(classifyHeading('Indemnification')).toBe(ClauseType.Indemnification);
      expect(classifyHeading('INDEMNITY AND HOLD HARMLESS')).toBe(ClauseType.Indemnification);
    });

    it('should classify termination headings', () => {
      expect(classifyHeading('Termination')).toBe(ClauseType.Termination);
      expect(classifyHeading('TERMINATION AND EXPIRATION')).toBe(ClauseType.Termination);
    });

    it('should classify confidentiality headings', () => {
      expect(classifyHeading('Confidentiality')).toBe(ClauseType.Confidentiality);
      expect(classifyHeading('Non-Disclosure Agreement')).toBe(ClauseType.Confidentiality);
      expect(classifyHeading('NDA')).toBe(ClauseType.Confidentiality);
    });

    it('should return General for unrecognized headings', () => {
      expect(classifyHeading('Miscellaneous')).toBe(ClauseType.General);
      expect(classifyHeading('Other Provisions')).toBe(ClauseType.General);
    });
  });

  describe('MIN_CLAUSE_THRESHOLD', () => {
    it('should be set to 3', () => {
      expect(MIN_CLAUSE_THRESHOLD).toBe(3);
    });
  });
});
