'use client';

import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    if (!isLoaded) return;
    setLoading(true);
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/chat',
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[oklch(0.10_0.007_52)]">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[oklch(0.74_0.13_68/0.06)] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.74_0.13_68/0.04)] blur-[100px]" />
      </div>

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Wordmark */}
        <div className="space-y-1">
          <h1 className="font-['Instrument_Serif'] text-5xl italic text-[oklch(0.92_0.008_60)]">
            personaLLM
          </h1>
          <p className="text-sm text-[oklch(0.55_0.008_60)]">
            Your AI, shaped by you.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-16 bg-[oklch(0.74_0.13_68/0.3)]" />

        {/* Welcome text */}
        <p className="max-w-xs text-[oklch(0.65_0.008_60)] text-sm leading-relaxed">
          Welcome. Sign in to access your conversations, personas, and settings across every device.
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={!isLoaded || loading}
          className="group flex items-center gap-3 rounded-xl border border-[oklch(0.25_0.007_52)] bg-[oklch(0.13_0.007_52)] px-6 py-3 text-sm font-medium text-[oklch(0.85_0.008_60)] transition-all duration-200 hover:border-[oklch(0.74_0.13_68/0.4)] hover:bg-[oklch(0.15_0.007_52)] hover:shadow-[0_0_20px_oklch(0.74_0.13_68/0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[oklch(0.74_0.13_68)] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <p className="text-xs text-[oklch(0.4_0.006_52)]">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
