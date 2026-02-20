'use client';

import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { calcCost, formatCost } from '@/lib/ai/pricing';
import { Coins, Cpu, TrendingUp } from 'lucide-react';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function UsageStats() {
  const { isAuthenticated } = useConvexAuth();
  const stats = useQuery(api.messages.usageStats, isAuthenticated ? {} : 'skip');

  if (!stats) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading usage data…</div>;
  }

  if (stats.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No usage data yet. Token stats appear after your first conversation.
      </div>
    );
  }

  // Totals across all conversations
  const totalPrompt = stats.reduce((s, c) => s + c.promptTokens, 0);
  const totalCompletion = stats.reduce((s, c) => s + c.completionTokens, 0);

  // Aggregate cost per model across all convos
  const allModelCounts: Record<string, number> = {};
  for (const conv of stats) {
    for (const [model, count] of Object.entries(conv.modelCounts)) {
      allModelCounts[model] = (allModelCounts[model] ?? 0) + count;
    }
  }
  const topModel = Object.entries(allModelCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Total cost: we don't have per-message model breakdown in stats query,
  // so estimate using topModel for simplicity
  const estimatedTotalCost = topModel
    ? calcCost(topModel, totalPrompt, totalCompletion)
    : null;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" /> Total tokens
          </div>
          <p className="text-lg font-semibold tabular-nums">{formatTokens(totalPrompt + totalCompletion)}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatTokens(totalPrompt)} in · {formatTokens(totalCompletion)} out
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" /> Est. cost
          </div>
          <p className="text-lg font-semibold tabular-nums">
            {estimatedTotalCost !== null ? formatCost(estimatedTotalCost) : '—'}
          </p>
          <p className="text-[11px] text-muted-foreground">across {stats.length} convos</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Top model
          </div>
          <p className="text-sm font-semibold truncate">{topModel?.split('/').pop() ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">{topModel ? `${allModelCounts[topModel]} responses` : ''}</p>
        </div>
      </div>

      {/* Per-conversation table */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Per conversation</h3>
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Conversation</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">In</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Out</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Total</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((conv, i) => {
                  const model = Object.entries(conv.modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
                  const cost = model ? calcCost(model, conv.promptTokens, conv.completionTokens) : null;
                  return (
                    <tr key={conv.conversationId} className={`border-b border-border/30 last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-3 py-2 max-w-[180px]">
                        <span className="truncate block text-xs">{conv.title}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">{formatTokens(conv.promptTokens)}</td>
                      <td className="px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">{formatTokens(conv.completionTokens)}</td>
                      <td className="px-3 py-2 text-right text-xs tabular-nums font-medium">{formatTokens(conv.promptTokens + conv.completionTokens)}</td>
                      <td className="px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">
                        {cost !== null ? formatCost(cost) : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          * Cost estimates use per-model public pricing. Actual charges may differ.
        </p>
      </div>
    </div>
  );
}
