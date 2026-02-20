/**
 * AES-256-GCM encryption for API keys.
 *
 * Design:
 *  - A random 256-bit "device secret" is generated once and stored in
 *    localStorage. It never changes, so the vault key is stable across
 *    browser sessions and tab closes.
 *  - The device secret IS the vault key (imported as AES-GCM).
 *  - Ciphertext (IV + encrypted bytes) is also stored in localStorage
 *    via settingsStore.
 *
 * Security properties:
 *  - API keys are never stored in plain text anywhere.
 *  - Protects against accidental server transmission or log capture.
 *  - Bound to the device/browser profile — not portable without both
 *    the device secret and the ciphertext.
 */

const DEVICE_SECRET_KEY = 'personaLLM_device_secret';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Module-level cache so we only import the CryptoKey once per page load.
let cachedKey: CryptoKey | null = null;

async function getVaultKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  // Get-or-create the stable device secret
  let secret = localStorage.getItem(DEVICE_SECRET_KEY);
  if (!secret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    secret = bufferToBase64(bytes.buffer);
    localStorage.setItem(DEVICE_SECRET_KEY, secret);
  }

  const rawKey = base64ToBuffer(secret);
  cachedKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedKey;
}

export async function encryptApiKey(plaintext: string): Promise<string> {
  const key = await getVaultKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return bufferToBase64(combined.buffer);
}

export async function decryptApiKey(ciphertextB64: string): Promise<string> {
  const key = await getVaultKey();
  const combined = base64ToBuffer(ciphertextB64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

/** Remove the device secret — forces all saved keys to become unreadable. */
export function clearVaultKey(): void {
  cachedKey = null;
  localStorage.removeItem(DEVICE_SECRET_KEY);
}
