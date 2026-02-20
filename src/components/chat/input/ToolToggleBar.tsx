'use client';

import { Search, Code2, FileText, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { useApiKeys } from '@/hooks/useApiKeys';
import { AVAILABLE_TOOLS, type ToolId } from '@/types/tools';

const ICONS: Record<ToolId, React.ReactNode> = {
  webSearch: <Search className="h-3.5 w-3.5" />,
  codeInterpreter: <Code2 className="h-3.5 w-3.5" />,
  generatePdf: <FileText className="h-3.5 w-3.5" />,
  deepResearch: <BookOpen className="h-3.5 w-3.5" />,
};

export function ToolToggleBar() {
  const enabledTools = useChatStore((s) => s.enabledTools);
  const toggleTool = useChatStore((s) => s.toggleTool);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const { hasKey } = useApiKeys();

  return (
    <div className="flex items-center gap-1">
      {AVAILABLE_TOOLS.map((tool) => {
        const enabled = enabledTools.includes(tool.id);
        const missingKey = tool.requiresKey && !hasKey(tool.requiresKey);

        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={enabled ? 'default' : 'ghost'}
                size="icon"
                className={`h-7 w-7 relative ${enabled ? '' : 'text-muted-foreground'} ${missingKey ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (missingKey) {
                    // Open settings so the user can add the required API key
                    setSettingsOpen(true);
                  } else {
                    toggleTool(tool.id);
                  }
                }}
              >
                {ICONS[tool.id]}
                {missingKey && (
                  <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {tool.name}
              {missingKey && (
                <span className="text-destructive ml-1">
                  -- click to add {tool.requiresKey} key
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
