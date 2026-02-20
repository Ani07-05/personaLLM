'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, ChevronDown, ExternalLink } from 'lucide-react';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface SearchToolResult {
  query: string;
  answer?: string;
  error?: string;
  results: SearchResult[];
}

interface SearchToolCardProps {
  args: { query: string; maxResults?: number };
  result?: SearchToolResult;
  state: 'pending' | 'running' | 'done' | 'error';
}

function getFavicon(url: string) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=16`;
  } catch {
    return null;
  }
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function SearchToolCard({ args, result, state }: SearchToolCardProps) {
  const [showSnippets, setShowSnippets] = useState(false);
  const snippetsRef = useRef<HTMLDivElement>(null);
  const [snippetsHeight, setSnippetsHeight] = useState(0);

  useEffect(() => {
    if (snippetsRef.current) {
      setSnippetsHeight(snippetsRef.current.scrollHeight);
    }
  }, [result, showSnippets]);

  return (
    <div className="my-3 space-y-2">
      {/* Query line */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {state === 'running' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
        ) : (
          <Search className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        )}
        <span className="italic truncate">
          {state === 'running' ? 'Searching for ' : 'Searched for '}
          <span className="font-medium not-italic text-foreground">&ldquo;{args.query}&rdquo;</span>
        </span>
        {result?.results?.length ? (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {result.results.length} sources
          </span>
        ) : null}
      </div>

      {/* Error message */}
      {result?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {/* Source pills */}
      {result?.results?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {result.results.map((r, i) => {
            const favicon = getFavicon(r.url);
            const domain = getDomain(r.url);
            return (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted transition-colors group"
                title={r.title}
              >
                {favicon && (
                  <img
                    src={favicon}
                    className="h-3 w-3 rounded-sm shrink-0"
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium max-w-[120px] truncate">
                  {domain}
                </span>
                <span className="text-primary/70 font-semibold">{i + 1}</span>
              </a>
            );
          })}

          {/* Toggle snippets */}
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${showSnippets ? 'rotate-180' : ''}`}
            />
            {showSnippets ? 'Hide' : 'Details'}
          </button>
        </div>
      ) : null}

      {/* Snippets (collapsible with smooth transition) */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: showSnippets && result?.results?.length ? `${snippetsHeight + 16}px` : '0px',
          opacity: showSnippets && result?.results?.length ? 1 : 0,
        }}
      >
        <div ref={snippetsRef} className="mt-1 space-y-2 pl-1">
          {result?.results?.map((r, i) => (
            <div key={i} className="group/snippet">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span className="text-muted-foreground mr-0.5">[{i + 1}]</span>
                {r.title}
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {r.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
