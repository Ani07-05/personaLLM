import { generateText } from 'ai';
import { buildProvider } from '@/lib/ai/providers';
import type { ProviderId } from '@/types/provider';

export type ResearchPhase = 'planning' | 'searching' | 'reading' | 'synthesizing' | 'writing' | 'done' | 'error';

export interface ResearchEvent {
  type: 'step' | 'progress' | 'done' | 'error';
  phase?: ResearchPhase;
  message?: string;
  result?: string;
  error?: string;
}

interface RunResearchOptions {
  query: string;
  providerId: ProviderId;
  modelId: string;
  apiKey?: string;
  tavilyKey: string;
  onEvent: (event: ResearchEvent) => void;
}

export async function runDeepResearch({
  query,
  providerId,
  modelId,
  apiKey,
  tavilyKey,
  onEvent,
}: RunResearchOptions): Promise<string> {
  const model = buildProvider({ providerId, modelId, apiKey });

  const emit = (phase: ResearchPhase, message: string) => {
    onEvent({ type: 'step', phase, message });
  };

  // ── 1. PLAN ─────────────────────────────────────────────────────────────────
  emit('planning', 'Generating research sub-queries…');

  const planResult = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: `You are a research assistant. Given the following research topic, generate 3-5 focused sub-queries that would help thoroughly cover the topic. Return ONLY a JSON array of strings.

Topic: "${query}"

Example output: ["sub-query 1", "sub-query 2", "sub-query 3"]`,
      },
    ],
    maxOutputTokens: 500,
  });

  let subQueries: string[] = [];
  try {
    const jsonMatch = planResult.text.match(/\[[\s\S]*\]/);
    subQueries = jsonMatch ? JSON.parse(jsonMatch[0]) : [query];
  } catch {
    subQueries = [query];
  }

  emit('planning', `Generated ${subQueries.length} sub-queries`);

  // ── 2. SEARCH ────────────────────────────────────────────────────────────────
  emit('searching', `Searching the web for ${subQueries.length} queries…`);

  const { tavily } = await import('@tavily/core');
  const tavilyClient = tavily({ apiKey: tavilyKey });

  const searchResults: Array<{ query: string; results: Array<{ title: string; url: string; content: string }> }> = [];

  for (const sq of subQueries) {
    emit('searching', `Searching: "${sq}"`);
    try {
      const result = await tavilyClient.search(sq, {
        maxResults: 5,
        searchDepth: 'advanced',
        includeAnswer: false,
      });
      searchResults.push({
        query: sq,
        results: result.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content.slice(0, 8000),
        })),
      });
    } catch (err) {
      emit('searching', `Search failed for "${sq}": ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // ── 3. READ ──────────────────────────────────────────────────────────────────
  emit('reading', 'Extracting relevant information from sources…');

  const summaries: Array<{ source: string; url: string; summary: string }> = [];

  for (const sr of searchResults) {
    for (const result of sr.results.slice(0, 3)) {
      emit('reading', `Reading: ${result.title}`);
      try {
        const readResult = await generateText({
          model,
          messages: [
            {
              role: 'user',
              content: `Extract and summarize the most relevant information from this source for the research topic: "${query}"

Source title: ${result.title}
Source URL: ${result.url}
Content:
${result.content}

Provide a concise summary (2-3 paragraphs) of the most relevant facts and insights.`,
            },
          ],
          maxOutputTokens: 500,
        });
        summaries.push({
          source: result.title,
          url: result.url,
          summary: readResult.text,
        });
      } catch {
        // Skip failed reads
      }
    }
  }

  emit('reading', `Extracted information from ${summaries.length} sources`);

  // ── 4. SYNTHESIZE ────────────────────────────────────────────────────────────
  emit('synthesizing', 'Synthesizing findings from all sources…');

  const synthesisInput = summaries
    .map((s, i) => `[${i + 1}] ${s.source} (${s.url})\n${s.summary}`)
    .join('\n\n---\n\n');

  // ── 5. WRITE ─────────────────────────────────────────────────────────────────
  emit('writing', 'Writing comprehensive research report…');

  const reportResult = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: `You are a research analyst. Write a comprehensive, well-structured research report on the following topic based on the provided source summaries.

Research Topic: "${query}"

Source Summaries:
${synthesisInput}

Write the report in markdown format with:
- An executive summary
- Key findings sections
- Analysis and insights
- Conclusion
- Citations referencing the sources [1], [2], etc.

Be thorough, factual, and cite sources appropriately.`,
      },
    ],
    maxOutputTokens: 4000,
  });

  const report = reportResult.text;

  // Add reference list
  const references = summaries
    .map((s, i) => `[${i + 1}] ${s.source} — ${s.url}`)
    .join('\n');

  const finalReport = `${report}\n\n---\n\n## References\n\n${references}`;

  onEvent({ type: 'done', phase: 'done', result: finalReport });

  return finalReport;
}
