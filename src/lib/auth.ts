// ============================================================
// Auth utilities — Openwork agent authentication
// ============================================================

export const AUTH_COOKIE = "ow_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AuthAgent {
  id: string;
  name: string;
  description?: string;
  specialties: string[];
  reputation: number;
  wallet_address?: string;
  avatar_url?: string;
}

/**
 * Validate an Openwork API key by calling /api/agents/me
 * Returns the agent profile if valid, null otherwise.
 */
export async function validateApiKey(
  apiKey: string
): Promise<AuthAgent | null> {
  try {
    const res = await fetch("https://www.openwork.bot/api/agents/me", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      specialties: data.specialties ?? [],
      reputation: data.reputation ?? 50,
      wallet_address: data.wallet_address,
      avatar_url: data.avatar_url,
    };
  } catch {
    return null;
  }
}
