'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResearchSource {
  index: number;
  title: string;
  url: string;
  content: string;
}

interface DeepResearchResult {
  query: string;
  subQueries: string[];
  sourcesCount: number;
  sources: ResearchSource[];
}

interface DeepResearchToolCardProps {
  args: { query: string };
  result?: DeepResearchResult;
  state: 'pending' | 'running' | 'done' | 'error';
}

export function DeepResearchToolCard({ args, result, state }: DeepResearchToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        {state === 'running' ? (
          <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
        ) : (
          <BookOpen className="h-4 w-4 text-indigo-500" />
        )}
        <span className="text-sm font-medium">Deep Research</span>
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {args.query}
        </span>
        {result && (
          <span className="text-xs text-muted-foreground">
            {result.sourcesCount} sources
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>

      {expanded && result && (
        <div className="border-t">
          {/* Sub-queries */}
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sub-queries</p>
            <div className="space-y-0.5">
              {result.subQueries.map((sq, i) => (
                <p key={i} className="text-xs text-muted-foreground">{sq}</p>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="px-3 py-2 space-y-1.5 max-h-64 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            {result.sources.map((source) => (
              <div key={source.index} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">[{source.index}]</span>
                <div className="min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">{source.title}</span>
                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
