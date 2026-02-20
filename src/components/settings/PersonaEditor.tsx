'use client';

import { useState } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type Persona = {
  _id: Id<'personas'>;
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
};

export function PersonaEditor() {
  const [selected, setSelected] = useState<Persona | null>(null);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const personas = (useQuery(api.personas.list, isAuthenticated ? {} : 'skip') ?? []) as Persona[];
  const createPersona = useMutation(api.personas.create);
  const updatePersona = useMutation(api.personas.update);
  const deletePersona = useMutation(api.personas.remove);
  const setDefaultPersona = useMutation(api.personas.setDefault);

  const handleSelect = (p: Persona) => {
    setSelected(p);
    setName(p.name);
    setPrompt(p.systemPrompt);
  };

  const handleNew = () => {
    setSelected(null);
    setName('');
    setPrompt('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (selected) {
        await updatePersona({ id: selected._id, name, systemPrompt: prompt });
      } else {
        await createPersona({ name, systemPrompt: prompt });
      }
      handleNew();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<'personas'>) => {
    await deletePersona({ id });
    if (selected?._id === id) handleNew();
  };

  const handleSetDefault = async (id: Id<'personas'>) => {
    await setDefaultPersona({ id });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Personas / System Prompts</h3>
        <Button size="sm" variant="outline" onClick={handleNew} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Persona list */}
      {personas.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {personas.map((p) => (
            <div
              key={p._id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted ${
                selected?._id === p._id ? 'bg-muted' : ''
              }`}
              onClick={() => handleSelect(p)}
            >
              <span className="flex-1 text-sm truncate">{p.name}</span>
              {p.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); handleSetDefault(p._id); }}
                title="Set as default"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Persona name"
          className="text-sm"
        />
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="You are a helpful assistant..."
          rows={5}
          className="text-sm font-mono resize-none"
        />
        <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
          {saving ? 'Saving…' : selected ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
