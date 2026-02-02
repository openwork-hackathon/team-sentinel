"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** The human-readable name of the page, e.g. "Leaderboard" */
  pageName: string;
}

export function RouteError({ error, reset, pageName }: RouteErrorProps) {
  useEffect(() => {
    console.error(`[Sentinel/${pageName}]`, error);
  }, [error, pageName]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Card className="max-w-sm w-full border-destructive/30">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>

          <h2 className="text-lg font-semibold mb-1">
            Failed to load {pageName}
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            There was a problem fetching the latest data.
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/50 font-mono mb-4">
              {error.digest}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sentinel-red text-white text-sm font-medium hover:bg-sentinel-red-dark transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
