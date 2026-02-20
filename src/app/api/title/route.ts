import { generateText } from 'ai';
import { buildProvider } from '@/lib/ai/providers';
import type { ProviderId } from '@/types/provider';

export async function POST(req: Request) {
  try {
    const { text, providerId, modelId, apiKey, ollamaBaseUrl } = await req.json();

    const model = buildProvider({
      providerId: (providerId ?? 'anthropic') as ProviderId,
      modelId: modelId ?? 'claude-haiku-4-5-20251001',
      apiKey,
      ollamaBaseUrl,
    });

    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: `Generate a short title (max 6 words, no quotes, no punctuation) for a chat that starts with: "${text.slice(0, 200)}"`,
        },
      ],
      maxOutputTokens: 20,
    });

    return Response.json({ title: result.text.trim().replace(/^["']|["']$/g, '') });
  } catch {
    return Response.json({ title: 'New Chat' });
  }
}
