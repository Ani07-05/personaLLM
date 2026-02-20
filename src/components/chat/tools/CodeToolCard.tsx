'use client';

import { useState } from 'react';
import { Code2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/markdown/CodeBlock';

interface CodeResult {
  stdout: string;
  stderr: string;
  results: Array<{ type: string; data?: string; text?: string }>;
  error?: string;
}

interface CodeToolCardProps {
  args: { code: string; language?: string };
  result?: CodeResult;
  state: 'pending' | 'running' | 'done' | 'error';
}

export function CodeToolCard({ args, result, state }: CodeToolCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
        {state === 'running' ? (
          <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
        ) : (
          <Code2 className="h-4 w-4 text-green-500" />
        )}
        <span className="text-sm font-medium">Code Interpreter</span>
        <span className="text-xs text-muted-foreground">{args.language ?? 'python'}</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>

      {expanded && (
        <div className="border-t">
          <CodeBlock language={args.language ?? 'python'}>{args.code}</CodeBlock>

          {result && (
            <div className="border-t px-3 py-2 space-y-2">
              {result.stdout && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                  <pre className="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                    {result.stdout}
                  </pre>
                </div>
              )}
              {result.stderr && (
                <div>
                  <p className="text-xs font-medium text-destructive mb-1">Stderr</p>
                  <pre className="text-xs bg-destructive/10 rounded p-2 overflow-x-auto text-destructive whitespace-pre-wrap">
                    {result.stderr}
                  </pre>
                </div>
              )}
              {result.error && (
                <div>
                  <p className="text-xs font-medium text-destructive mb-1">Error</p>
                  <pre className="text-xs bg-destructive/10 rounded p-2 overflow-x-auto text-destructive whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              )}
              {result.results.map((r, i) => (
                r.data?.startsWith('data:image') ? (
                  <div key={i}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Chart / Image</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.data} alt="Code output" className="max-w-full rounded border" />
                  </div>
                ) : r.text ? (
                  <pre key={i} className="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                    {r.text}
                  </pre>
                ) : null
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
