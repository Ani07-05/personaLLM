'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeySection } from './ApiKeySection';
import { PersonaEditor } from './PersonaEditor';
import { UsageStats } from './UsageStats';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage API keys and personas.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="keys">
          <TabsList className="w-full">
            <TabsTrigger value="keys" className="flex-1">API Keys</TabsTrigger>
            <TabsTrigger value="personas" className="flex-1">Personas</TabsTrigger>
            <TabsTrigger value="usage" className="flex-1">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="mt-4">
            <ApiKeySection />
          </TabsContent>

          <TabsContent value="personas" className="mt-4">
            <PersonaEditor />
          </TabsContent>

          <TabsContent value="usage" className="mt-4">
            <UsageStats />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
