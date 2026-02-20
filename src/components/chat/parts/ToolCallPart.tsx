import { SearchToolCard } from '../tools/SearchToolCard';
import { CodeToolCard } from '../tools/CodeToolCard';
import { PdfToolCard } from '../tools/PdfToolCard';
import { DeepResearchToolCard } from '../tools/DeepResearchToolCard';

// v5 tool part shape: type is "tool-<toolName>"
export interface V5ToolPart {
  type: string; // "tool-webSearch", "tool-codeInterpreter", etc.
  toolCallId: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: unknown;
  output?: unknown;
  error?: unknown;
}

interface ToolCallPartProps {
  part: V5ToolPart;
}

function getToolState(state: V5ToolPart['state']): 'pending' | 'running' | 'done' | 'error' {
  switch (state) {
    case 'input-streaming': return 'running';
    case 'input-available': return 'running';
    case 'output-available': return 'done';
    case 'output-error': return 'error';
  }
}

export function ToolCallPart({ part }: ToolCallPartProps) {
  const toolName = part.type.replace(/^tool-/, '');
  const state = getToolState(part.state);
  const args = (part.input ?? {}) as Record<string, unknown>;
  const result = part.state === 'output-available' ? part.output : undefined;

  if (toolName === 'webSearch') {
    return (
      <SearchToolCard
        args={args as { query: string; maxResults?: number }}
        result={result as Parameters<typeof SearchToolCard>[0]['result']}
        state={state}
      />
    );
  }

  if (toolName === 'codeInterpreter') {
    return (
      <CodeToolCard
        args={args as { code: string; language?: string }}
        result={result as Parameters<typeof CodeToolCard>[0]['result']}
        state={state}
      />
    );
  }

  if (toolName === 'generatePdf') {
    return (
      <PdfToolCard
        args={args as { title: string; content: string; filename?: string }}
        result={result as Parameters<typeof PdfToolCard>[0]['result']}
        state={state}
      />
    );
  }

  if (toolName === 'deepResearch') {
    return (
      <DeepResearchToolCard
        args={args as { query: string }}
        result={result as Parameters<typeof DeepResearchToolCard>[0]['result']}
        state={state}
      />
    );
  }

  // Generic fallback
  return (
    <div className="my-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
      <span className="font-mono text-xs text-muted-foreground">{toolName}</span>
      {part.input !== undefined && (
        <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(args, null, 2)}</pre>
      )}
      {result !== undefined && (
        <pre className="mt-1 text-xs overflow-x-auto border-t pt-1">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
