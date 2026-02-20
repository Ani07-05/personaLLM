import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export function createWebSearchTool(tavilyApiKey: string) {
  return tool({
    description:
      'Search the web for current information, news, and facts. Use this when you need up-to-date information.',
    inputSchema: zodSchema(
      z.object({
        query: z.string().describe('The search query to look up'),
        maxResults: z
          .number()
          .optional()
          .default(5)
          .describe('Maximum number of results to return'),
      })
    ),
    execute: async ({ query, maxResults = 5 }) => {
      try {
        const { tavily } = await import('@tavily/core');
        const client = tavily({ apiKey: tavilyApiKey });

        const response = await client.search(query, {
          maxResults,
          searchDepth: 'advanced',
          includeAnswer: true,
          includeImages: false,
        });

        return {
          query,
          answer: response.answer,
          results: response.results.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
          })),
        };
      } catch (error) {
        console.error('[webSearch] Tool execution failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          query,
          error: `Web search failed: ${message}. Please check that a valid Tavily API key is configured in Settings.`,
          results: [],
        };
      }
    },
  });
}
