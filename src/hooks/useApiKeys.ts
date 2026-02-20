'use client';

import { useCallback } from 'react';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto/keyVault';
import { getEncryptedKey, setEncryptedKey, removeEncryptedKey, setKeyPreview, touchKeyLastUsed } from '@/lib/storage/settingsStore';

export function useApiKeys() {
  const storeKey = useCallback(async (keyId: string, plaintext: string): Promise<void> => {
    if (!plaintext) {
      removeEncryptedKey(keyId);
      return;
    }
    const encrypted = await encryptApiKey(plaintext);
    setEncryptedKey(keyId, encrypted);
    setKeyPreview(keyId, plaintext);
  }, []);

  const getKey = useCallback(async (keyId: string): Promise<string | undefined> => {
    const encrypted = getEncryptedKey(keyId);
    if (!encrypted) return undefined;
    try {
      const key = await decryptApiKey(encrypted);
      touchKeyLastUsed(keyId);
      return key;
    } catch {
      return undefined;
    }
  }, []);

  const hasKey = useCallback((keyId: string): boolean => {
    return !!getEncryptedKey(keyId);
  }, []);

  const removeKey = useCallback((keyId: string): void => {
    removeEncryptedKey(keyId);
  }, []);

  return { storeKey, getKey, hasKey, removeKey };
}
