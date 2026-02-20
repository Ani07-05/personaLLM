'use client';

import { useEffect } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfResult {
  action: string;
  title: string;
  content: string;
  filename: string;
}

interface PdfToolCardProps {
  args: { title: string; content: string; filename?: string };
  result?: PdfResult;
  state: 'pending' | 'running' | 'done' | 'error';
}

export function PdfToolCard({ args, result, state }: PdfToolCardProps) {
  const handleDownload = async () => {
    if (!result) return;
    const { generateAndDownloadPdf } = await import('@/lib/pdf/generator');
    await generateAndDownloadPdf(result.title, result.content, result.filename);
  };

  // Auto-trigger download when result arrives
  useEffect(() => {
    if (result?.action === 'generate-pdf' && state === 'done') {
      handleDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, state]);

  return (
    <div className="my-2 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        {state === 'running' ? (
          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 text-orange-500" />
        )}
        <span className="text-sm font-medium">PDF Generator</span>
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {args.title}
        </span>
        {result && state === 'done' && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-7 text-xs"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
