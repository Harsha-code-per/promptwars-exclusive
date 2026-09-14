import { BenchmarkClause, DocumentType } from '../types/legal';

export const BENCHMARK_CLAUSES: BenchmarkClause[] = [
  // --- FREELANCE SERVICES ---
  {
    documentType: 'freelance_services',
    clauseType: 'Payment Terms',
    clauseText: 'Payment Terms. Client shall pay Contractor the agreed-upon fee within thirty (30) days of receiving a valid invoice. Invoices shall be submitted upon completion of each milestone or on a monthly basis, as mutually agreed. Late payments shall accrue interest at a rate of 1.5% per month or the maximum rate permitted by law, whichever is lower. Either party may dispute an invoice in good faith by providing written notice within fifteen (15) days of receipt, and the undisputed portion shall remain due.',
    sourceAttribution: 'Common Paper Standard Freelance Agreement and Freelancers Union model contract'
  },
  {
    documentType: 'freelance_services',
    clauseType: 'Intellectual Property',
    clauseText: 'Intellectual Property. Upon full payment of all fees due, Contractor assigns to Client all right, title, and interest in the work product created under this Agreement, excluding Contractor\'s pre-existing intellectual property and general knowledge, skills, and experience. Contractor retains the right to use general tools, techniques, and methodologies developed or refined during the engagement. Contractor grants Client a perpetual, non-exclusive license to any pre-existing IP incorporated into the deliverables.',
    sourceAttribution: 'Common Paper Standard Freelance Agreement and AIGA standard design contract'
  },
  {
    documentType: 'freelance_services',
    clauseType: 'Indemnification',
    clauseText: 'Indemnification. Each party shall indemnify and hold harmless the other party from and against any third-party claims, losses, damages, and reasonable expenses (including attorneys\' fees) arising from (a) the indemnifying party\'s breach of this Agreement, (b) the indemnifying party\'s gross negligence or willful misconduct, or (c) the indemnifying party\'s violation of applicable law. The indemnified party shall provide prompt written notice and reasonable cooperation in the defense of any claim.',
    sourceAttribution: 'Common Paper balanced bilateral indemnification clause'
  },
  {
    documentType: 'freelance_services',
    clauseType: 'Limitation of Liability',
    clauseText: 'Limitation of Liability. Neither party shall be liable to the other for any indirect, incidental, special, consequential, or punitive damages arising out of or related to this Agreement, regardless of the theory of liability. Each party\'s total cumulative liability under this Agreement shall not exceed the total fees paid or payable under this Agreement during the twelve (12) months preceding the claim. This limitation does not apply to breaches of confidentiality obligations or indemnification duties.',
    sourceAttribution: 'Common Paper Standard Freelance Agreement'
  },
  {
    documentType: 'freelance_services',
    clauseType: 'Termination',
    clauseText: 'Termination. Either party may terminate this Agreement for convenience upon thirty (30) days\' prior written notice to the other party. Either party may terminate this Agreement immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within fifteen (15) days of receiving written notice thereof. Upon termination, Client shall pay Contractor for all work completed and accepted through the effective date of termination.',
    sourceAttribution: 'Common Paper Standard Freelance Agreement'
  },
  {
    documentType: 'freelance_services',
    clauseType: 'Non-Compete/Non-Solicitation',
    clauseText: 'Non-Solicitation. During the term of this Agreement and for twelve (12) months thereafter, neither party shall directly solicit for employment any employee or contractor of the other party who was involved in the performance of this Agreement, without the prior written consent of the other party. This restriction does not apply to general job postings or unsolicited applications. This clause does not restrict Contractor from performing services for Client\'s competitors.',
    sourceAttribution: 'Freelancers Union model terms — balanced non-solicitation without non-compete'
  },

  // --- RESIDENTIAL LEASE ---
  {
    documentType: 'residential_lease',
    clauseType: 'Security Deposit',
    clauseText: 'Security Deposit. Tenant shall deposit with Landlord the sum equal to one month rent as security for the performance of Tenant\'s obligations. The deposit shall be held in a separate, interest-bearing escrow account in accordance with state law. Within thirty (30) days of lease termination and surrender of the premises, Landlord shall return the deposit to Tenant, minus any itemized deductions for damages beyond ordinary wear and tear.',
    sourceAttribution: 'Uniform Residential Landlord and Tenant Act (URLTA) Section 2.101'
  },
  {
    documentType: 'residential_lease',
    clauseType: 'Landlord Entry',
    clauseText: 'Landlord Entry. Landlord may enter the premises only for inspection, repairs, or showing to prospective tenants or purchasers, and only after providing Tenant with at least twenty-four (24) hours\' written notice. Entry shall occur only during reasonable business hours (9:00 AM to 6:00 PM), except in cases of emergency where immediate entry is necessary to protect life or property.',
    sourceAttribution: 'URLTA Section 3.103 — standard 24-hour notice requirement'
  },
  {
    documentType: 'residential_lease',
    clauseType: 'Maintenance & Repairs',
    clauseText: 'Maintenance & Repairs. Landlord shall maintain the premises in a fit and habitable condition, including maintaining all electrical, plumbing, heating, ventilating, and air conditioning systems in good working order. Landlord shall promptly address any condition that impairs the habitability of the premises within fourteen (14) days of receiving written notice from Tenant.',
    sourceAttribution: 'URLTA Section 2.104 and implied warranty of habitability'
  },
  {
    documentType: 'residential_lease',
    clauseType: 'Termination & Holdover',
    clauseText: 'Termination & Holdover. Either party may terminate a month-to-month tenancy by providing written notice at least thirty (30) days prior to the periodic rental date. If Tenant holds over without Landlord\'s consent, Landlord may recover possession and an amount not to exceed one and one-half (1.5) times the monthly rent, calculated on a daily basis.',
    sourceAttribution: 'URLTA Section 4.301'
  },

  // --- EMPLOYMENT AGREEMENT ---
  {
    documentType: 'employment_agreement',
    clauseType: 'Invention Assignment & IP',
    clauseText: 'Invention Assignment. Employee assigns to Employer all inventions, patents, and software created during employment using Employer facilities or directly relating to Employer actual business. This assignment does NOT apply to any invention created entirely on Employee own time without using Employer equipment or proprietary trade secrets, in accordance with California Labor Code Section 2870.',
    sourceAttribution: 'California Labor Code § 2870 Standard Statutory Invention Carve-Out'
  },
  {
    documentType: 'employment_agreement',
    clauseType: 'Restrictive Covenants & Non-Compete',
    clauseText: 'Restrictive Covenants. Employee agrees to protect Employer proprietary confidential information. Following termination, Employee shall not be restrained from engaging in any lawful profession, trade, or business of any kind, in accordance with FTC Non-Compete Rule (16 CFR Part 910).',
    sourceAttribution: 'FTC Non-Compete Rule 16 CFR Part 910'
  },

  // --- VENDOR MSA ---
  {
    documentType: 'vendor_msa',
    clauseType: 'Indemnification & Liability Cap',
    clauseText: 'Liability Cap. Neither party total cumulative liability arising out of or related to this Agreement shall exceed the total amount paid by Customer to Vendor in the twelve (12) months preceding the incident giving rise to liability. Each party indemnification obligations shall be strictly bilateral and capped at 2x annual contract value.',
    sourceAttribution: 'Common Paper Cloud Service Agreement (CSA) Standard Enterprise Terms'
  }
];

export function getBenchmarksForDocumentType(docType: DocumentType): BenchmarkClause[] {
  return BENCHMARK_CLAUSES.filter((b) => b.documentType === docType);
}

export function findMatchingBenchmark(clauseText: string, docType?: DocumentType): BenchmarkClause | null {
  const pool = docType ? getBenchmarksForDocumentType(docType) : BENCHMARK_CLAUSES;
  const lower = clauseText.toLowerCase();

  for (const benchmark of pool) {
    const typeWords = benchmark.clauseType.toLowerCase().split(/[\s/]+/);
    const matchesType = typeWords.some(word => word.length > 3 && lower.includes(word));
    if (matchesType) {
      return benchmark;
    }
  }

  return pool[0] || null;
}
