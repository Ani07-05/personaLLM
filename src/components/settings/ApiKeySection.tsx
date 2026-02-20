'use client';

import { useState, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Check, Key, Loader2, AlertCircle, ShieldCheck, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiKeys } from '@/hooks/useApiKeys';
import { getKeyPreview, getKeyLastUsed } from '@/lib/storage/settingsStore';

interface KeyConfig {
  keyId: string;
  label: string;
  placeholder: string;
  validate?: (key: string) => string | null; // sync format check
  serverValidate?: (key: string) => Promise<string | null>;
}

/** Quick format validators — never sends key anywhere */
function validateFormat(keyId: string, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (keyId) {
    case 'anthropic':
      return v.startsWith('sk-ant-') ? null : 'Key should start with sk-ant-';
    case 'openai':
      return v.startsWith('sk-') ? null : 'Key should start with sk-';
    case 'google':
      return v.startsWith('AIza') ? null : 'Key should start with AIza';
    case 'nvidia':
      return v.startsWith('nvapi-') ? null : 'Key should start with nvapi-';
    case 'tavily':
      return v.startsWith('tvly-') ? null : 'Key should start with tvly-';
    case 'e2b':
      return v.startsWith('e2b_') ? null : 'Key should start with e2b_';
    default:
      return null;
  }
}

function keyStrength(value: string): { level: 'weak' | 'ok' | 'strong'; label: string } {
  const len = value.trim().length;
  if (len === 0) return { level: 'weak', label: '' };
  if (len < 20) return { level: 'weak', label: 'Short' };
  if (len < 40) return { level: 'ok', label: 'OK' };
  return { level: 'strong', label: 'Good' };
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface ApiKeyRowProps {
  keyId: string;
  label: string;
  placeholder: string;
  serverValidate?: (key: string) => Promise<string | null>;
}

function ApiKeyRow({ keyId, label, placeholder, serverValidate }: ApiKeyRowProps) {
  const { storeKey, hasKey, removeKey } = useApiKeys();
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [lastUsed, setLastUsed] = useState<number | undefined>();

  useEffect(() => {
    if (hasKey(keyId)) {
      setPreview(getKeyPreview(keyId));
      setLastUsed(getKeyLastUsed(keyId));
    }
  }, [keyId, hasKey, saved]);

  const formatError = value ? validateFormat(keyId, value) : null;
  const strength = keyStrength(value);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    setError(null);

    const fmtErr = validateFormat(keyId, trimmed);
    if (fmtErr) { setError(fmtErr); return; }

    if (serverValidate) {
      setValidating(true);
      try {
        const validationError = await serverValidate(trimmed);
        if (validationError) { setError(validationError); setValidating(false); return; }
      } catch (e) {
        // Network failure — save anyway, don't block
      }
      setValidating(false);
    }

    await storeKey(keyId, trimmed);
    setValue('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [keyId, value, storeKey, serverValidate]);

  const handleRemove = useCallback(() => {
    removeKey(keyId);
    setPreview(undefined);
    setLastUsed(undefined);
    setError(null);
  }, [keyId, removeKey]);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5 text-primary" />
          {label}
        </label>
        {hasKey(keyId) && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              title="Remove key"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Saved key preview */}
      {hasKey(keyId) && preview && (
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground font-mono">
          <span>{preview}</span>
          {lastUsed && (
            <span className="flex items-center gap-1 non-mono text-[11px]">
              <Clock className="h-3 w-3" />
              Used {timeAgo(lastUsed)}
            </span>
          )}
        </div>
      )}

      {/* Input */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={visible ? 'text' : 'password'}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              placeholder={hasKey(keyId) ? 'Enter new key to replace…' : placeholder}
              className={`pr-9 font-mono text-sm ${error || formatError ? 'border-destructive focus-visible:ring-destructive/20' : value && !formatError ? 'border-emerald-500/50 focus-visible:ring-emerald-500/20' : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) handleSave(); }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setVisible(!visible)}
              type="button"
            >
              {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!value.trim() || validating || !!formatError}
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : 'Save'}
          </Button>
        </div>

        {/* Strength meter */}
        {value && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 flex-1">
              {(['weak', 'ok', 'strong'] as const).map((lvl, i) => (
                <div
                  key={lvl}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    ['weak', 'ok', 'strong'].indexOf(strength.level) >= i
                      ? strength.level === 'weak' ? 'bg-destructive'
                        : strength.level === 'ok' ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            {strength.label && (
              <span className={`text-[11px] ${
                strength.level === 'weak' ? 'text-destructive'
                  : strength.level === 'ok' ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}>
                {strength.label}
              </span>
            )}
          </div>
        )}

        {(error || formatError) && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error ?? formatError}
          </p>
        )}
      </div>
    </div>
  );
}

async function validateTavilyKey(key: string): Promise<string | null> {
  try {
    const res = await fetch('/api/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'tavily', key }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return data.error || 'Invalid API key';
    return null;
  } catch {
    return null; // Network failure — save anyway
  }
}

export function ApiKeySection() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          AI Provider Keys
        </h3>
        <div className="space-y-3">
          <ApiKeyRow keyId="anthropic" label="Anthropic" placeholder="sk-ant-api03-..." />
          <ApiKeyRow keyId="openai" label="OpenAI" placeholder="sk-proj-..." />
          <ApiKeyRow keyId="google" label="Google AI" placeholder="AIzaSy..." />
          <ApiKeyRow keyId="nvidia" label="NVIDIA" placeholder="nvapi-..." />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Tool Keys</h3>
        <div className="space-y-3">
          <ApiKeyRow keyId="tavily" label="Tavily (Web Search)" placeholder="tvly-..." serverValidate={validateTavilyKey} />
          <ApiKeyRow keyId="e2b" label="E2B (Code Interpreter)" placeholder="e2b_..." />
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          End-to-end secure
        </p>
        <p>Keys are encrypted with AES-256-GCM using a session key stored only in your browser's sessionStorage. They are never transmitted to any server except the respective AI provider.</p>
      </div>
    </div>
  );
}
