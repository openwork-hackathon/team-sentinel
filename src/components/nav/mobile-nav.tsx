"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Wallet,
  Briefcase,
  Coins,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenuMobile } from "@/components/auth/user-menu";

const navItems = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Leaders", href: "/leaderboard", icon: Trophy },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Token", href: "/token", icon: Coins },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isActive
                  ? "text-sentinel-red"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <UserMenuMobile />
      </div>
    </nav>
  );
}
