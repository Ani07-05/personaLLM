'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Copy, Check, GitBranch, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UIMessage } from 'ai';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { ReasoningPart } from './parts/ReasoningPart';
import { ToolCallPart } from './parts/ToolCallPart';
import { calcCost, formatCost } from '@/lib/ai/pricing';

interface AssistantMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  onFork?: (messageId: string) => void;
}

export const AssistantMessage = memo(function AssistantMessage({ message, isStreaming, onFork }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);

  const rawText = useMemo(
    () =>
      message.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join(''),
    [message.parts]
  );

  const meta = message.metadata as Record<string, unknown> | undefined;
  const tokenUsage = meta?.tokenUsage as { promptTokens: number; completionTokens: number } | undefined;
  const modelId = meta?.modelId as string | undefined;
  const cost = tokenUsage && modelId ? calcCost(modelId, tokenUsage.promptTokens, tokenUsage.completionTokens) : null;
  const totalTokens = tokenUsage ? tokenUsage.promptTokens + tokenUsage.completionTokens : null;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rawText]);

  const handleFork = useCallback(() => {
    onFork?.(message.id);
  }, [onFork, message.id]);

  return (
    <div className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-2">
        {message.parts.map((part, i) => {
          if (part.type === 'reasoning') {
            return <ReasoningPart key={i} text={part.text} />;
          }

          if (part.type === 'text') {
            return <MarkdownRenderer key={i} content={part.text} />;
          }

          if (part.type.startsWith('tool-')) {
            return <ToolCallPart key={i} part={part as Parameters<typeof ToolCallPart>[0]['part']} />;
          }
          return null;
        })}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block h-4 w-[2px] bg-foreground/60 animate-blink ml-0.5 rounded-full" />
        )}

        {/* Actions + token count */}
        {!isStreaming && rawText.length > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                title="Copy"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Good response">
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Bad response">
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Regenerate">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              {onFork && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleFork}
                  title="Fork conversation"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {tokenUsage && (
              <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span
                  className="text-[11px] text-muted-foreground/50 tabular-nums"
                  title={`${tokenUsage.promptTokens.toLocaleString()} prompt + ${tokenUsage.completionTokens.toLocaleString()} completion = ${totalTokens?.toLocaleString()} total`}
                >
                  {totalTokens?.toLocaleString()} ctx
                </span>
                {cost !== null && (
                  <span className="text-[11px] text-muted-foreground/50 tabular-nums" title="Estimated cost for this response">
                    {formatCost(cost)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
