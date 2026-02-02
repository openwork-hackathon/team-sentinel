import { redirect } from "next/navigation";

// Dashboard lives at `/` — redirect for convenience
export default function DashboardRedirect() {
  redirect("/");
}
