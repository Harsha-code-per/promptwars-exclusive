/**
 * Fenco — Direct Sample Document Auditor
 * Runs the live pipeline directly on a contract text file using Gemini 2.5 Flash.
 */
const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { GoogleGenerativeAI } = require('../backend/node_modules/@google/generative-ai');
const { splitClauses } = require('../backend/dist/modules/ingestion/clauseSplitter');

// Benchmark examples for grounding
const BENCHMARKS = {
  'Payment Terms': 'Payment Terms. Client shall pay Contractor within thirty (30) days of receiving a valid invoice. Late payments shall accrue interest at 1.5% per month or maximum legal rate. Undisputed portions shall remain due during good faith dispute.',
  'Scope of Work': 'Scope of Work. Contractor shall perform services in the SOW. Additional work requires a written change order signed by both parties specifying scope, timeline, and fee adjustments.',
  'Intellectual Property': 'Intellectual Property. Upon full payment of fees, Contractor assigns to Client rights to custom work product, excluding Contractor pre-existing tools, libraries, and general methodologies.',
  'Confidentiality': 'Confidentiality. Each party holds the other\'s confidential information in confidence for two (2) years. Standard exclusions apply for publicly known or independently developed information.',
  'Indemnification': 'Indemnification. Each party indemnifies the other from third-party claims arising from the indemnifying party\'s breach, gross negligence, or willful misconduct. Neither party indemnifies for the other party\'s negligence.',
  'Limitation of Liability': 'Limitation of Liability. Neither party shall be liable for indirect or consequential damages. Each party\'s total aggregate liability shall be capped at the total fees paid or payable under this Agreement in the preceding 12 months.',
  'Termination': 'Termination. Either party may terminate with thirty (30) days written notice without cause, or immediately for material breach following a 15-day cure period. Client shall pay for all work satisfactorily completed prior to termination.',
  'Non-Compete/Non-Solicitation': 'Non-Solicitation. During the term and for six (6) months thereafter, neither party shall solicit the other\'s employees. No restriction prevents contractor from performing general consulting for other clients.',
  'Dispute Resolution': 'Dispute Resolution. Good faith executive negotiation for 30 days prior to mediation. If unresolved, binding arbitration with each party bearing its own costs and sharing neutral fees equally.',
  'Governing Law': 'Governing Law. Governed by the laws of the jurisdiction where the primary services are delivered.',
  'Warranty/Representations': 'Warranties. Contractor warrants work will be performed in a professional, workmanlike manner meeting documented specifications for a period of ninety (90) days following delivery.',
  'Force Majeure': 'Force Majeure. Neither party is liable for failure or delay caused by events beyond reasonable control. Both parties are excused during the duration of the event.',
  'Amendments': 'Amendments. No amendment or waiver is effective unless in writing and signed by authorized representatives of both parties.',
  'Assignment': 'Assignment. Neither party may assign without written consent, except in connection with a merger or sale of substantially all assets.',
  'Notice': 'Notice. Written notices delivered by email or registered courier to designated addresses are deemed received on confirmation of transmission or 3 days post-dispatch.',
  'General': 'General. Standard boilerplate terms providing mutual protections without disproportionate burdens on either party.'
};

const DISCLAIMER = `IMPORTANT: Output is for informational purposes only and does not constitute legal advice. Always recommend consulting a licensed attorney for binding guidance.`;

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
];
let activeModel = CANDIDATE_MODELS[0];

async function callGeminiJSON(systemPrompt, userPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = [
    activeModel,
    ...CANDIDATE_MODELS.filter((m) => m !== activeModel),
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    const isLastModel = i === modelsToTry.length - 1;

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });
      const res = await model.generateContent(userPrompt);
      if (modelName !== activeModel) {
        console.log(`[gemini] Switched active model to: ${modelName}`);
        activeModel = modelName;
      }
      return JSON.parse(res.response.text());
    } catch (err) {
      const msg = (err.message || '').slice(0, 100);
      if (!isLastModel) {
        const nextModel = modelsToTry[i + 1];
        console.warn(`[gemini] ${modelName} failed (${msg}). Switching to ${nextModel}...`);
        activeModel = nextModel;
      } else {
        console.warn(`[gemini] Model ${modelName} warning: ${msg}`);
      }
    }
  }
  throw new Error(`All candidate Gemini models failed: ${CANDIDATE_MODELS.join(', ')}`);
}

async function auditContract(filePath) {
  const resolvedPath = path.resolve(filePath);
  console.log(`\n======================================================`);
  console.log(`📡 Fenco — Contract Risk Audit`);
  console.log(`📄 Document: ${path.basename(resolvedPath)}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const contractText = fs.readFileSync(resolvedPath, 'utf8');
  console.log(`[1/3] Splitting contract into clauses...`);
  const clauses = splitClauses(contractText);
  console.log(`✓ Detected ${clauses.length} distinct clauses.\n`);

  console.log(`[2/3] Evaluating risk against benchmarks with Gemini 2.5 Flash...`);
  
  const clauseListPrompt = clauses.map((c, idx) => {
    const benchmark = BENCHMARKS[c.clauseType] || BENCHMARKS['General'];
    return `CLAUSE #${idx + 1} (${c.clauseType}):
Contract Text: ${c.clauseText}
Market Benchmark: ${benchmark}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert contract risk auditor. ${DISCLAIMER}
Compare each contract clause against its market benchmark.
Identify directional legal variance, unilateral obligations, extreme liabilities, and hidden gotchas.
Respond with a JSON array of objects:
[
  {
    "index": number (1-based),
    "clauseType": string,
    "riskLevel": "Standard" | "Caution" | "Unfavorable",
    "explanation": "Concise plain-language explanation of practical risks (1-3 sentences)"
  }
]`;

  const results = await callGeminiJSON(systemPrompt, `Evaluate these contract clauses against their benchmarks:\n\n${clauseListPrompt}`);
  
  const scoredMap = new Map();
  results.forEach(r => scoredMap.set(r.index, r));

  const scoredClauses = clauses.map((c, i) => {
    const evalResult = scoredMap.get(i + 1) || {
      riskLevel: 'Caution',
      explanation: 'Requires review against market standard terms.'
    };
    return {
      index: i + 1,
      clauseType: c.clauseType,
      clauseText: c.clauseText,
      riskLevel: evalResult.riskLevel,
      explanation: evalResult.explanation
    };
  });

  scoredClauses.forEach(c => {
    const tag = c.riskLevel === 'Unfavorable' ? '❌ UNFAVORABLE' : c.riskLevel === 'Caution' ? '⚠️  CAUTION' : '✅ STANDARD';
    console.log(`  Clause ${c.index}: ${c.clauseType.padEnd(26)} -> ${tag}`);
  });

  console.log(`\n[3/3] Generating Gotchas & Counter-Drafts for top flagged clauses...`);
  const flagged = scoredClauses.filter(c => c.riskLevel === 'Unfavorable' || c.riskLevel === 'Caution');
  
  // Single prompt for Gotchas & Counter-Drafts
  const synthesisSystem = `You are a contract assistant. ${DISCLAIMER}
Respond with a JSON object:
{
  "gotchas": [
    {
      "title": "Short punchy summary (e.g. 'You Can Be Sued For Their Mistakes')",
      "explanation": "Plain language practical impact on signer (1-2 sentences)",
      "riskLevel": "Unfavorable" | "Caution"
    }
  ],
  "counterDrafts": [
    {
      "clauseType": string,
      "counterDraft": "Ready-to-copy balanced contract clause text",
      "explanation": "Why this change balances the contract"
    }
  ]
}`;

  const topFlaggedText = flagged.slice(0, 4).map(f => `[${f.riskLevel}] ${f.clauseType}:\nText: ${f.clauseText}\nIssue: ${f.explanation}`).join('\n\n');

  const synthesis = await callGeminiJSON(synthesisSystem, `Create 3-4 "Before You Sign" gotchas and 2-3 ready-to-use counter-drafts for these flagged clauses:\n\n${topFlaggedText}`);

  // Print Summary
  console.log(`\n======================================================`);
  console.log(`📊 RISK AUDIT SUMMARY`);
  console.log(`======================================================`);
  const unfavorableCount = scoredClauses.filter(c => c.riskLevel === 'Unfavorable').length;
  const cautionCount = scoredClauses.filter(c => c.riskLevel === 'Caution').length;
  const standardCount = scoredClauses.filter(c => c.riskLevel === 'Standard').length;

  console.log(`Total Clauses:     ${scoredClauses.length}`);
  console.log(`❌ Unfavorable:    ${unfavorableCount}`);
  console.log(`⚠️  Caution:        ${cautionCount}`);
  console.log(`✅ Standard:       ${standardCount}`);

  console.log(`\n------------------------------------------------------`);
  console.log(`⚠️  BEFORE YOU SIGN — TOP GOTCHAS`);
  console.log(`------------------------------------------------------`);
  (synthesis.gotchas || []).forEach((g, i) => {
    console.log(`\n${i + 1}. [${g.riskLevel.toUpperCase()}] ${g.title}`);
    console.log(`   ${g.explanation}`);
  });

  console.log(`\n------------------------------------------------------`);
  console.log(`✍️  READY-TO-USE COUNTER-DRAFTS`);
  console.log(`------------------------------------------------------`);
  (synthesis.counterDrafts || []).forEach((cd, i) => {
    console.log(`\n[Counter-Draft ${i + 1}: ${cd.clauseType}]`);
    console.log(`Proposed Language:\n"${cd.counterDraft}"`);
    console.log(`\nWhy this change:\n${cd.explanation}\n`);
  });

  console.log(`======================================================`);
  console.log(`⚖️  DISCLAIMER: Informational purposes only — not legal advice.`);
  console.log(`   Always consult a licensed attorney before signing.`);
  console.log(`======================================================\n`);
}

const targetFile = process.argv[2] || path.join(__dirname, 'Freelance_Developer_Agreement.txt');
auditContract(targetFile).catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
