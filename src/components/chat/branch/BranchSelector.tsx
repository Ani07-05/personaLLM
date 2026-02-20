'use client';

import { useRouter } from 'next/navigation';
import { GitBranch, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

type Branch = {
  _id: string;
  conversationId: string;
  parentBranchId?: string;
  forkMessageId?: string;
  name?: string;
};

interface BranchSelectorProps {
  conversationId: string;
  activeBranchId: string;
}

export function BranchSelector({ conversationId, activeBranchId }: BranchSelectorProps) {
  const router = useRouter();
  const branchData = useQuery(api.branches.getForConversation, {
    conversationId: conversationId as Id<'conversations'>,
  });
  const branches: Branch[] = (branchData ?? []).map((b: Branch) => b);

  if (branches.length <= 1) return null;

  const activeBranch = branches.find((b) => b._id === activeBranchId);
  const rootBranch = branches.find((b) => !b.parentBranchId);

  const handleSelect = (branch: Branch) => {
    if (branch._id === rootBranch?._id) {
      router.push(`/chat/${conversationId}`);
    } else {
      router.push(`/chat/${conversationId}/branch/${branch._id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
          <GitBranch className="h-3.5 w-3.5" />
          {activeBranch?.name ?? (activeBranch?._id === rootBranch?._id ? 'Main' : 'Branch')}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel className="text-xs">Branches</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch._id}
            onClick={() => handleSelect(branch)}
            className={branch._id === activeBranchId ? 'bg-muted' : ''}
          >
            <GitBranch className="mr-2 h-3.5 w-3.5" />
            {branch.name ?? (branch._id === rootBranch?._id ? 'Main' : `Branch ${branch._id.slice(0, 6)}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
