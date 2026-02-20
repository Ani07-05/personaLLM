'use client';

import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ForkButtonProps {
  messageId: string;
  onFork: (messageId: string) => void;
}

export function ForkButton({ messageId, onFork }: ForkButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onFork(messageId)}
        >
          <GitBranch className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Fork conversation from here
      </TooltipContent>
    </Tooltip>
  );
}
