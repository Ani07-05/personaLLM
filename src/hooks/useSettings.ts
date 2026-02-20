'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadSettings, saveSettings, type AppSettings } from '@/lib/storage/settingsStore';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') {
      return {
        encryptedApiKeys: {},
        keyPreviews: {},
        keyLastUsed: {},
        defaultProviderId: 'anthropic',
        defaultModelId: 'claude-sonnet-4-6',
        ollamaBaseUrl: 'http://localhost:11434',
        theme: 'system',
      };
    }
    return loadSettings();
  });

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
