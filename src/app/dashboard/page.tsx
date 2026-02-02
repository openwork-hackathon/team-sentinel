// Dashboard redirect is now handled in next.config.js for Vercel CDN reliability.
// Keeping this page as a fallback for local dev / edge cases.
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DashboardRedirect() {
  redirect("/");
}
