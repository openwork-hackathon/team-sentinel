// Dashboard redirect — robust CDN cache-busting
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Explicit route segment config to prevent ANY caching
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export default function DashboardRedirect() {
  // Force headers read to ensure dynamic rendering
  headers();
  redirect("/");
}
