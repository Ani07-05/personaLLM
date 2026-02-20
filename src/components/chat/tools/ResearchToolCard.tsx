'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import type { ResearchPhase, ResearchStep } from '@/store/researchStore';

interface ResearchToolCardProps {
  query: string;
  phase: ResearchPhase;
  steps: ResearchStep[];
  result?: string;
  error?: string;
}

const PHASE_LABELS: Record<ResearchPhase, string> = {
  idle: 'Idle',
  planning: 'Planning queries…',
  searching: 'Searching the web…',
  reading: 'Reading sources…',
  synthesizing: 'Synthesizing findings…',
  writing: 'Writing report…',
  done: 'Complete',
  error: 'Error',
};

export function ResearchToolCard({ query, phase, steps, result, error }: ResearchToolCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isRunning = !['done', 'error', 'idle'].includes(phase);

  return (
    <div className="my-2 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        {isRunning ? (
          <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
        ) : (
          <BookOpen className="h-4 w-4 text-indigo-500" />
        )}
        <span className="text-sm font-medium">Deep Research</span>
        <span className="flex-1 truncate text-sm text-muted-foreground">&ldquo;{query}&rdquo;</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>

      {expanded && (
        <div className="border-t">
          {/* Phase progress */}
          <div className="px-3 py-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {PHASE_LABELS[phase]}
            </p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {i < steps.length - 1 || phase === 'done' ? (
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-muted-foreground">{step.message}</span>
              </div>
            ))}
          </div>

          {/* Result */}
          {result && (
            <div className="border-t px-3 py-3">
              <MarkdownRenderer content={result} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-t px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
