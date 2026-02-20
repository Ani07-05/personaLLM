import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export function createDeepResearchTool(tavilyApiKey: string) {
  return tool({
    description:
      'Conduct deep multi-step research on a topic. Searches the web with multiple sub-queries, reads and summarizes sources, then synthesizes a comprehensive report. Use this for complex questions that need thorough investigation from multiple angles.',
    inputSchema: zodSchema(
      z.object({
        query: z.string().describe('The research topic or question to investigate deeply'),
      })
    ),
    execute: async ({ query }) => {
      const { tavily } = await import('@tavily/core');
      const client = tavily({ apiKey: tavilyApiKey });

      // Step 1: Generate sub-queries by splitting the topic
      const subQueries = generateSubQueries(query);

      // Step 2: Search for each sub-query
      const allResults: Array<{ query: string; results: Array<{ title: string; url: string; content: string }> }> = [];

      for (const sq of subQueries) {
        try {
          const response = await client.search(sq, {
            maxResults: 5,
            searchDepth: 'advanced',
            includeAnswer: false,
          });
          allResults.push({
            query: sq,
            results: response.results.map((r) => ({
              title: r.title,
              url: r.url,
              content: r.content.slice(0, 4000),
            })),
          });
        } catch {
          // Skip failed searches
        }
      }

      // Step 3: Compile sources
      const sources: Array<{ title: string; url: string; content: string }> = [];
      const seenUrls = new Set<string>();
      for (const sr of allResults) {
        for (const result of sr.results) {
          if (!seenUrls.has(result.url)) {
            seenUrls.add(result.url);
            sources.push(result);
          }
        }
      }

      // Return the raw research data for the model to synthesize
      return {
        query,
        subQueries,
        sourcesCount: sources.length,
        sources: sources.slice(0, 15).map((s, i) => ({
          index: i + 1,
          title: s.title,
          url: s.url,
          content: s.content,
        })),
      };
    },
  });
}

/**
 * Generate sub-queries for deeper research coverage.
 * Simple heuristic approach -- the model will refine with context.
 */
function generateSubQueries(query: string): string[] {
  const queries = [
    query,
    `${query} latest developments`,
    `${query} analysis and insights`,
    `${query} challenges and limitations`,
  ];
  return queries;
}
