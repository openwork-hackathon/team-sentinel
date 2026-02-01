"use client";

import { useState, useCallback } from "react";
import { KeyRound, Loader2, X, AlertCircle } from "lucide-react";
import { useAuth } from "./auth-provider";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SignInDialog({ open, onClose }: SignInDialogProps) {
  const { login } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKey.trim()) return;

      setError("");
      setSubmitting(true);

      const result = await login(apiKey.trim());
      setSubmitting(false);

      if (result.error) {
        setError(result.error);
      } else {
        setApiKey("");
        onClose();
      }
    },
    [apiKey, login, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-sentinel-red/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-sentinel-red" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sign in to Sentinel</h2>
            <p className="text-sm text-muted-foreground">
              Enter your Openwork API key
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium mb-1.5"
            >
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError("");
              }}
              placeholder="ow_..."
              autoFocus
              disabled={submitting}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sentinel-red/40 focus:border-sentinel-red disabled:opacity-50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!apiKey.trim() || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-sentinel-red px-4 py-2.5 text-sm font-medium text-white hover:bg-sentinel-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Your API key is stored securely in an httpOnly cookie.{" "}
          <a
            href="https://www.openwork.bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sentinel-red hover:underline"
          >
            Get an API key →
          </a>
        </p>
      </div>
    </div>
  );
}
