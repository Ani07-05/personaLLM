'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface ReasoningPartProps {
  text: string;
}

function summarizeReasoning(text: string): string {
  const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return 'Thinking...';
  const lastLine = lines[lines.length - 1].trim();
  if (lastLine.length > 80) return lastLine.slice(0, 77) + '...';
  return lastLine;
}

export function ReasoningPart({ text }: ReasoningPartProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = useMemo(() => summarizeReasoning(text), [text]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [text, expanded]);

  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Small amber dot to indicate thinking */}
        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary/80 transition-colors shrink-0" />
        <span className="leading-relaxed italic">{summary}</span>
        <ChevronRight
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? `${contentHeight + 16}px` : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="mt-2 border-l-2 border-primary/30 pl-3">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground/70">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
