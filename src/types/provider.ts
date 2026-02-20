export type ProviderId = 'anthropic' | 'openai' | 'google' | 'ollama' | 'nvidia';

export interface ModelConfig {
  id: string;
  name: string;
  providerId: ProviderId;
  contextWindow: number;
  supportsThinking?: boolean;
  supportsVision?: boolean;
  supportsTools?: boolean;
}

export const PROVIDER_MODELS: Record<ProviderId, ModelConfig[]> = {
  anthropic: [
    {
      id: 'claude-opus-4-6',
      name: 'Claude Opus 4.6',
      providerId: 'anthropic',
      contextWindow: 200000,
      supportsThinking: true,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: 'claude-sonnet-4-6',
      name: 'Claude Sonnet 4.6',
      providerId: 'anthropic',
      contextWindow: 200000,
      supportsThinking: true,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      providerId: 'anthropic',
      contextWindow: 200000,
      supportsThinking: false,
      supportsVision: true,
      supportsTools: true,
    },
  ],
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      providerId: 'openai',
      contextWindow: 128000,
      supportsThinking: false,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      providerId: 'openai',
      contextWindow: 128000,
      supportsThinking: false,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: 'o1',
      name: 'o1',
      providerId: 'openai',
      contextWindow: 200000,
      supportsThinking: true,
      supportsVision: true,
      supportsTools: false,
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      providerId: 'openai',
      contextWindow: 200000,
      supportsThinking: true,
      supportsVision: false,
      supportsTools: true,
    },
  ],
  google: [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      providerId: 'google',
      contextWindow: 1000000,
      supportsThinking: false,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: 'gemini-2.0-flash-thinking-exp',
      name: 'Gemini 2.0 Flash Thinking',
      providerId: 'google',
      contextWindow: 1000000,
      supportsThinking: true,
      supportsVision: true,
      supportsTools: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      providerId: 'google',
      contextWindow: 2000000,
      supportsThinking: false,
      supportsVision: true,
      supportsTools: true,
    },
  ],
  nvidia: [
    {
      id: 'moonshotai/kimi-k2.5',
      name: 'Kimi K2.5',
      providerId: 'nvidia' as const,
      contextWindow: 131072,
      supportsThinking: false,
      supportsVision: true,
      supportsTools: true,
    },
  ],
  ollama: [
    {
      id: 'llama3.3',
      name: 'Llama 3.3',
      providerId: 'ollama',
      contextWindow: 128000,
      supportsThinking: false,
      supportsVision: false,
      supportsTools: true,
    },
    {
      id: 'qwen2.5:14b',
      name: 'Qwen 2.5 14B',
      providerId: 'ollama',
      contextWindow: 128000,
      supportsThinking: false,
      supportsVision: false,
      supportsTools: true,
    },
    {
      id: 'deepseek-r1:14b',
      name: 'DeepSeek R1 14B',
      providerId: 'ollama',
      contextWindow: 64000,
      supportsThinking: true,
      supportsVision: false,
      supportsTools: false,
    },
  ],
};

export const ALL_MODELS: ModelConfig[] = Object.values(PROVIDER_MODELS).flat();

export function getModel(providerId: ProviderId, modelId: string): ModelConfig | undefined {
  return PROVIDER_MODELS[providerId]?.find((m) => m.id === modelId);
}
