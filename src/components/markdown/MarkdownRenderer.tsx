import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

// Module-level constants — never recreated, so ReactMarkdown won't
// deep-diff and re-render every streaming token.
const REMARK_PLUGINS = [remarkGfm] as const;

const MARKDOWN_COMPONENTS: Components = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const language = match?.[1];
    const isBlock = !!(node?.position?.start.line !== node?.position?.end.line || language);

    if (isBlock || language) {
      return (
        <CodeBlock language={language}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    }

    return (
      <code
        className="rounded-md bg-red-500/10 text-red-400 dark:bg-red-500/15 dark:text-red-300 px-1.5 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0 leading-7">{children}</p>;
  },
  ul({ children }) {
    return <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-7">{children}</li>;
  },
  h1({ children }) {
    return <h1 className="mb-3 mt-6 text-2xl font-bold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-5 text-xl font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="mb-1 mt-3 font-semibold">{children}</h4>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="mb-3 border-l-4 border-muted-foreground/30 pl-4 text-muted-foreground italic">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="mb-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border border-border px-3 py-2">{children}</td>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 hover:opacity-80"
      >
        {children}
      </a>
    );
  },
  hr() {
    return <hr className="my-4 border-border" />;
  },
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS as any}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
