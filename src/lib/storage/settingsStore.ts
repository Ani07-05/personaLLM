export interface AppSettings {
  encryptedApiKeys: Record<string, string>; // providerId/toolId -> encrypted key
  keyPreviews: Record<string, string>;       // providerId/toolId -> "sk-ant-...•••3a9f"
  keyLastUsed: Record<string, number>;       // providerId/toolId -> unix ms
  defaultProviderId: string;
  defaultModelId: string;
  ollamaBaseUrl: string;
  theme: 'light' | 'dark' | 'system';
}

const SETTINGS_KEY = 'personaLLM_settings';

const defaultSettings: AppSettings = {
  encryptedApiKeys: {},
  keyPreviews: {},
  keyLastUsed: {},
  defaultProviderId: 'anthropic',
  defaultModelId: 'claude-sonnet-4-6',
  ollamaBaseUrl: 'http://localhost:11434',
  theme: 'system',
};

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  if (typeof window === 'undefined') return;
  const current = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

export function getEncryptedKey(keyId: string): string | undefined {
  const settings = loadSettings();
  return settings.encryptedApiKeys[keyId];
}

export function setEncryptedKey(keyId: string, encrypted: string): void {
  const settings = loadSettings();
  settings.encryptedApiKeys[keyId] = encrypted;
  saveSettings({ encryptedApiKeys: settings.encryptedApiKeys });
}

export function removeEncryptedKey(keyId: string): void {
  const settings = loadSettings();
  delete settings.encryptedApiKeys[keyId];
  delete settings.keyPreviews[keyId];
  delete settings.keyLastUsed[keyId];
  saveSettings({
    encryptedApiKeys: settings.encryptedApiKeys,
    keyPreviews: settings.keyPreviews,
    keyLastUsed: settings.keyLastUsed,
  });
}

export function setKeyPreview(keyId: string, plaintext: string): void {
  const settings = loadSettings();
  const preview =
    plaintext.length > 12
      ? `${plaintext.slice(0, 8)}...${plaintext.slice(-4)}`
      : `${plaintext.slice(0, 4)}...`;
  settings.keyPreviews[keyId] = preview;
  saveSettings({ keyPreviews: settings.keyPreviews });
}

export function getKeyPreview(keyId: string): string | undefined {
  return loadSettings().keyPreviews[keyId];
}

export function touchKeyLastUsed(keyId: string): void {
  const settings = loadSettings();
  settings.keyLastUsed[keyId] = Date.now();
  saveSettings({ keyLastUsed: settings.keyLastUsed });
}

export function getKeyLastUsed(keyId: string): number | undefined {
  return loadSettings().keyLastUsed[keyId];
}
