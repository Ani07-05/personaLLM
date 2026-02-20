'use client';

import { useRef, useEffect, useCallback, type KeyboardEvent } from 'react';

interface MessageTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageTextarea({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Message personaLLM…',
}: MessageTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSubmit();
        }
      }
    },
    [disabled, value, onSubmit]
  );

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className="w-full min-h-[44px] max-h-[240px] resize-none bg-transparent p-0 text-sm leading-7 placeholder:text-muted-foreground border-none outline-none focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
