import { runDeepResearch } from '@/lib/research/agent';
import type { ProviderId } from '@/types/provider';

export const maxDuration = 300;

export async function POST(req: Request) {
  const {
    query,
    providerId,
    modelId,
    apiKey,
    tavilyKey,
  } = await req.json();

  if (!query || !tavilyKey) {
    return new Response('Missing query or tavilyKey', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await runDeepResearch({
          query,
          providerId: (providerId ?? 'anthropic') as ProviderId,
          modelId: modelId ?? 'claude-sonnet-4-6',
          apiKey,
          tavilyKey,
          onEvent: (event) => send(event),
        });
      } catch (error) {
        send({
          type: 'error',
          error: error instanceof Error ? error.message : 'Research failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
