'use client';

import { useChatStore } from '@/store/chatStore';
import { PROVIDER_MODELS, type ProviderId } from '@/types/provider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  nvidia: 'NVIDIA',
  ollama: 'Ollama (Local)',
};

export function ModelSelector() {
  const providerId = useChatStore((s) => s.providerId);
  const modelId = useChatStore((s) => s.modelId);
  const setProvider = useChatStore((s) => s.setProvider);

  const handleChange = (value: string) => {
    const [pId, mId] = value.split('::') as [ProviderId, string];
    setProvider(pId, mId);
  };

  return (
    <Select value={`${providerId}::${modelId}`} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[200px] text-xs border-none bg-transparent shadow-none hover:bg-muted focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(PROVIDER_MODELS) as [ProviderId, typeof PROVIDER_MODELS[ProviderId]][]).map(
          ([pId, models]) => (
            <SelectGroup key={pId}>
              <SelectLabel>{PROVIDER_LABELS[pId]}</SelectLabel>
              {models.map((model) => (
                <SelectItem key={model.id} value={`${pId}::${model.id}`}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )
        )}
      </SelectContent>
    </Select>
  );
}
