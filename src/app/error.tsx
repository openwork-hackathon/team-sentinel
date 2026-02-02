"use client";

import { useEffect } from "react";
import { Activity, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Sentinel] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-destructive/30">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-2">
            An unexpected error occurred while loading this page.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono mb-6">
              Error ID: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sentinel-red text-white text-sm font-medium hover:bg-sentinel-red-dark transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </a>
          </div>

          {/* Branding */}
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-sentinel-red/20 flex items-center justify-center">
              <Activity className="w-2.5 h-2.5 text-sentinel-red" />
            </div>
            Sentinel Dashboard
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
