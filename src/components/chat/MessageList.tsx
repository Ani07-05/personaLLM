'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { UIMessage } from 'ai';
import { MessageItem } from './MessageItem';

const SUGGESTIONS = [
  { icon: '✦', label: 'Write', prompt: 'Help me write something compelling' },
  { icon: '</>', label: 'Code', prompt: 'Write a Python script to sort a CSV file' },
  { icon: '◎', label: 'Explain', prompt: 'Explain quantum computing in simple terms' },
  { icon: '⊞', label: 'Summarise', prompt: 'Summarize the key ideas in "Thinking, Fast and Slow"' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

interface MessageListProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  isWaiting?: boolean;
  onFork?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onSuggestion?: (text: string) => void;
  readOnly?: boolean;
  conversationId?: string;
}

export function MessageList({ messages, isStreaming, isWaiting, onFork, onEdit, onSuggestion, readOnly, conversationId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserNearBottomRef = useRef(true);
  const greeting = useMemo(() => getGreeting(), []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserNearBottomRef.current = distFromBottom < 120;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!isStreaming) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const scrollToBottom = () => {
      if (isUserNearBottomRef.current) container.scrollTop = container.scrollHeight;
      rafId = null;
    };

    // Batch DOM mutations into single rAF — prevents scroll recalc on every token
    const observer = new MutationObserver(() => {
      if (rafId === null) {
        rafId = requestAnimationFrame(scrollToBottom);
      }
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });
    scrollToBottom();

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isStreaming]);

  // Show skeleton when we have a conversationId but messages haven't loaded yet
  if (messages.length === 0 && conversationId) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-36">
        <div className="mx-auto max-w-3xl space-y-8">
          {[80, 55, 90, 40].map((w, i) => (
            <div key={i} className={`flex ${i % 2 === 1 ? 'justify-end' : 'justify-start'} animate-pulse`}>
              <div
                className={`rounded-2xl bg-muted/40 h-10 ${i % 2 === 1 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 select-none">
        {/* Greeting */}
        <div className="flex items-center gap-3 mb-2">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" className="shrink-0 text-primary opacity-80">
            <path d="M16 2v28M2 16h28M5.5 5.5l21 21M26.5 5.5l-21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <h1
            className="text-4xl font-normal tracking-tight text-foreground whitespace-nowrap"
            style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontStyle: 'italic' }}
          >
            {greeting}
          </h1>
        </div>

        {/* Suggestion pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => onSuggestion?.(s.prompt)}
              className="flex items-center gap-2 rounded-full border border-border/40 bg-card px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all duration-150"
            >
              <span className="text-primary/70 text-xs leading-none">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 pt-8 pb-36"
      onScroll={handleScroll}
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
            style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
          >
            <MessageItem
              message={msg}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              onFork={onFork}
              onEdit={onEdit}
            />
          </div>
        ))}
        {isWaiting && (
          <div className="flex items-center gap-2 text-muted-foreground/60 text-sm pl-1">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
