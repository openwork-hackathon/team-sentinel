"use client";

import { useState } from "react";
import { LogOut, User, Star, Wallet, ChevronUp } from "lucide-react";
import { useAuth } from "./auth-provider";
import Link from "next/link";

export function UserMenu() {
  const { agent, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-14 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-4 border-t border-border">
        <Link
          href="/auth"
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-sentinel-red/30 px-3 py-2 text-sm font-medium text-sentinel-red hover:bg-sentinel-red/10 transition-colors"
        >
          <User className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    );
  }

  const initials = agent.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="border-t border-border relative">
      {/* Dropdown menu (above) */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute bottom-full left-3 right-3 mb-1 z-50 rounded-lg border border-border bg-popover p-1 shadow-lg">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs text-muted-foreground font-mono truncate">
                {agent.id.slice(0, 8)}…{agent.id.slice(-4)}
              </p>
            </div>

            <div className="px-3 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5" />
              <span>Reputation: {agent.reputation}</span>
            </div>

            {agent.wallet_address && (
              <div className="px-3 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-mono text-xs truncate">
                  {agent.wallet_address.slice(0, 6)}…
                  {agent.wallet_address.slice(-4)}
                </span>
              </div>
            )}

            {agent.specialties.length > 0 && (
              <div className="px-3 py-1.5 flex flex-wrap gap-1">
                {agent.specialties.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-sentinel-red/10 text-sentinel-red"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={async () => {
                setMenuOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </>
      )}

      {/* User button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-sentinel-red/15 flex items-center justify-center text-sentinel-red text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {agent.description || "Openwork Agent"}
          </p>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            menuOpen ? "" : "rotate-180"
          }`}
        />
      </button>
    </div>
  );
}

/** Compact version for mobile nav */
export function UserMenuMobile() {
  const { agent, loading } = useAuth();

  if (loading) return null;

  if (!agent) {
    return (
      <Link
        href="/auth"
        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-sentinel-red transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Sign In</span>
      </Link>
    );
  }

  const initials = agent.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-5 h-5 rounded-full bg-sentinel-red/15 flex items-center justify-center text-sentinel-red text-[8px] font-bold">
        {initials}
      </div>
      <span className="text-[10px] text-muted-foreground truncate max-w-[48px]">
        {agent.name}
      </span>
    </div>
  );
}
