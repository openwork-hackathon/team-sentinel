import Link from "next/link";
import { Activity, ArrowLeft, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-border/50">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-sentinel-red/10 flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-sentinel-red" />
          </div>

          {/* Error code */}
          <p className="text-5xl font-bold text-sentinel-red mb-2">404</p>
          <h1 className="text-xl font-semibold mb-2">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sentinel-red text-white text-sm font-medium hover:bg-sentinel-red-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Browse Jobs
            </Link>
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
