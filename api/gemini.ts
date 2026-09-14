import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

const CASCADE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-pro',
  'gemini-3.1-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

export default async function handler(req: Request) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read backend secret (GEMINI_API_KEY or fallback VITE_GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { model: requestedModel, prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Build prioritized cascade list starting with the requested model
    const modelsToTry = requestedModel 
      ? [requestedModel, ...CASCADE_MODELS.filter(m => m !== requestedModel)]
      : CASCADE_MODELS;

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        const generativeModel = genAI.getGenerativeModel({ model: modelName });
        const result = await generativeModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({
          modelUsed: modelName,
          candidates: [{
            content: {
              parts: [{ text }]
            }
          }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[Edge Cascade] Model ${modelName} failed (${lastError.message}), attempting fallback...`);
      }
    }

    throw lastError || new Error('All cascade models failed');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
