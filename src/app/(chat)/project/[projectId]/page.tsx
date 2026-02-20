'use client';

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProjectFilePanel } from '@/components/project/ProjectFilePanel';
import { ProjectChatList } from '@/components/project/ProjectChatList';
import { FolderOpen } from 'lucide-react';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default function ProjectPage({ params }: Props) {
  const { projectId } = use(params);
  const project = useQuery(api.projects.get, { id: projectId as Id<'projects'> });

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 shrink-0 bg-background/90 backdrop-blur-md">
        <SidebarTrigger />
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <div>
          <h1 className="text-sm font-medium">{project?.name ?? 'Loading…'}</h1>
          {project?.description && (
            <p className="text-xs text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File panel */}
        <div className="w-52 shrink-0">
          {project && <ProjectFilePanel projectId={project._id} />}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-hidden">
          {project && <ProjectChatList projectId={project._id} />}
        </div>
      </div>
    </div>
  );
}
