import { anthropic } from '@ai-sdk/anthropic';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import type { ProviderId } from '@/types/provider';

interface ProviderConfig {
  providerId: ProviderId;
  modelId: string;
  apiKey?: string;
  ollamaBaseUrl?: string;
}

export function buildProvider({
  providerId,
  modelId,
  apiKey,
  ollamaBaseUrl,
}: ProviderConfig): LanguageModel {
  switch (providerId) {
    case 'anthropic': {
      if (apiKey) {
        const { createAnthropic } = require('@ai-sdk/anthropic');
        return createAnthropic({ apiKey })(modelId);
      }
      return anthropic(modelId);
    }
    case 'openai': {
      if (apiKey) {
        return createOpenAI({ apiKey })(modelId);
      }
      return openai(modelId);
    }
    case 'google': {
      if (apiKey) {
        return createGoogleGenerativeAI({ apiKey })(modelId);
      }
      return google(modelId);
    }
    case 'nvidia': {
      const nvidiaClient = createOpenAI({
        baseURL: 'https://integrate.api.nvidia.com/v1',
        apiKey: apiKey ?? '',
      });
      return nvidiaClient.chat(modelId);
    }
    case 'ollama': {
      const baseURL = `${ollamaBaseUrl ?? 'http://localhost:11434'}/v1`;
      const ollamaClient = createOpenAI({ baseURL, apiKey: 'ollama' });
      return ollamaClient(modelId);
    }
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}
