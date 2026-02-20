'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Plus,
  Settings,
  MoreHorizontal,
  Trash2,
  Pin,
  Pencil,
  Search,
  X,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog';
import { UserButton } from '@clerk/nextjs';

type Conversation = {
  _id: Id<'conversations'>;
  title: string;
  updatedAt: number;
  pinnedAt?: number;
  archivedAt?: number;
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const { isAuthenticated } = useConvexAuth();

  const conversations = useQuery(
    api.conversations.list,
    isAuthenticated ? {} : 'skip'
  ) as Conversation[] | undefined;
  const projects = useQuery(
    api.projects.list,
    isAuthenticated ? {} : 'skip'
  ) as Array<{ _id: Id<'projects'>; name: string }> | undefined;
  const removeConv = useMutation(api.conversations.remove);
  const pinConv = useMutation(api.conversations.pin);
  const renameConv = useMutation(api.conversations.rename);

  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: Id<'conversations'>) => {
      e.preventDefault();
      e.stopPropagation();
      await removeConv({ id });
      if (pathname.includes(id)) router.push('/chat');
    },
    [pathname, router, removeConv]
  );

  const handlePin = useCallback(
    async (e: React.MouseEvent, conv: Conversation) => {
      e.preventDefault();
      e.stopPropagation();
      await pinConv({ id: conv._id, pinned: !conv.pinnedAt });
    },
    [pinConv]
  );

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations.filter((c) => !c.archivedAt);
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => !c.archivedAt && c.title.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const pinned = useMemo(() => filtered.filter((c) => c.pinnedAt), [filtered]);
  const recent = useMemo(() => filtered.filter((c) => !c.pinnedAt), [filtered]);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="p-3 gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span
              className="text-base leading-none"
              style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontStyle: 'italic' }}
            >
              personaLLM
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleNewChat}
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-lg bg-sidebar-accent/60 border border-sidebar-border/60 pl-8 pr-7 py-1.5 text-xs text-sidebar-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-sidebar-ring/50 transition-colors"
          />
          {isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Projects section */}
        {!isSearching && (
          <SidebarGroup>
            <button
              onClick={() => setProjectsOpen((o) => !o)}
              className="flex items-center justify-between w-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="uppercase tracking-wider">Projects</span>
              <div className="flex items-center gap-1">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreateProjectOpen(true);
                  }}
                  className="p-0.5 rounded hover:text-foreground cursor-pointer"
                  title="New project"
                  role="button"
                >
                  <Plus className="h-3 w-3" />
                </span>
                {projectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </button>

            {projectsOpen && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {(projects ?? []).map((project) => (
                    <SidebarMenuItem key={project._id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes(project._id)}
                        className="gap-2"
                      >
                        <Link href={`/project/${project._id}`}>
                          <FolderOpen className="h-4 w-4 shrink-0 opacity-60" />
                          <span className="truncate">{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {(projects ?? []).length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground/60">
                      No projects yet
                    </div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {isSearching && (
          <div className="px-3 py-1.5 text-xs text-muted-foreground">
            {filtered.length === 0 ? 'No results' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
          </div>
        )}

        {pinned.length > 0 && !isSearching && (
          <SidebarGroup>
            <SidebarGroupLabel>Pinned</SidebarGroupLabel>
            <SidebarGroupContent>
              <ConversationList
                conversations={pinned}
                pathname={pathname}
                onDelete={handleDelete}
                onPin={handlePin}
                onRename={renameConv}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          {pinned.length > 0 && !isSearching && <SidebarGroupLabel>Recent</SidebarGroupLabel>}
          <SidebarGroupContent>
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>{isSearching ? 'No conversations found' : 'No conversations yet'}</p>
                {!isSearching && <p className="mt-1 text-xs">Start a new chat to begin</p>}
              </div>
            ) : (
              <ConversationList
                conversations={isSearching ? filtered : recent}
                pathname={pathname}
                onDelete={handleDelete}
                onPin={handlePin}
                onRename={renameConv}
              />
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
    </Sidebar>
  );
}

function ConversationList({
  conversations,
  pathname,
  onDelete,
  onPin,
  onRename,
}: {
  conversations: Conversation[];
  pathname: string;
  onDelete: (e: React.MouseEvent, id: Id<'conversations'>) => void;
  onPin: (e: React.MouseEvent, conv: Conversation) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRename: (args: { id: Id<'conversations'>; title: string }) => Promise<any>;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (conv: Conversation) => {
    setRenamingId(conv._id);
    setDraft(conv.title);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = async (id: Id<'conversations'>) => {
    if (draft.trim()) await onRename({ id, title: draft.trim() });
    setRenamingId(null);
  };

  return (
    <SidebarMenu>
      {conversations.map((conv) => {
        const isActive = pathname.includes(conv._id);
        const isRenaming = renamingId === conv._id;

        return (
          <SidebarMenuItem key={conv._id}>
            {isRenaming ? (
              <div className="px-2 py-1">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitRename(conv._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(conv._id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full rounded bg-sidebar-accent border border-sidebar-ring/50 px-2 py-0.5 text-sm outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="pr-8"
                  onDoubleClick={() => startRename(conv)}
                >
                  <Link href={`/chat/${conv._id}`}>
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="truncate">{conv.title}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal className="h-4 w-4" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem onClick={() => startRename(conv)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => onPin(e, conv)}>
                      <Pin className="mr-2 h-4 w-4" />
                      {conv.pinnedAt ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => onDelete(e, conv._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
