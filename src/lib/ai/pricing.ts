// Prices in USD per 1M tokens (as of 2026-02)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4-6':            { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':          { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001':  { input: 0.80,  output: 4.00  },
  // OpenAI
  'gpt-4o':                     { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':                { input: 0.15,  output: 0.60  },
  'o1':                         { input: 15.00, output: 60.00 },
  'o3-mini':                    { input: 1.10,  output: 4.40  },
  // Google
  'gemini-2.0-flash':           { input: 0.10,  output: 0.40  },
  'gemini-2.0-flash-thinking-exp': { input: 0.00, output: 0.00 },
  'gemini-1.5-pro':             { input: 1.25,  output: 5.00  },
  // NVIDIA / Kimi
  'moonshotai/kimi-k2.5':       { input: 1.00,  output: 3.00  },
};

export function calcCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number | null {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return null;
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
}

export function formatCost(usd: number): string {
  if (usd < 0.000001) return '<$0.000001';
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}
