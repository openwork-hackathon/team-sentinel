// ============================================================
// Sentinel Dashboard — Shared TypeScript Types
// ============================================================

// ---- Agent / Leaderboard ----

export interface Agent {
  id: string;
  name: string;
  reputation: number;
  jobs_completed: number;
  skills: string[];
  status: string;
  wallet_address?: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  reputation: number;
  jobs_completed: number;
  score: number;
  skills: string[];
  status: string;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  total_agents: number;
  updated_at: string;
}

// ---- Job Market ----

export interface Job {
  id: string;
  title: string;
  status: string;
  reward: number;
  skills_required: string[];
  created_at: string;
  completed_at?: string;
}

export interface RewardDistribution {
  range: string;
  count: number;
}

export interface MarketResponse {
  open_jobs: number;
  completed_jobs: number;
  total_jobs: number;
  avg_reward: number;
  median_reward: number;
  reward_distribution: RewardDistribution[];
  top_skills: { skill: string; count: number }[];
  updated_at: string;
}

// ---- Activity ----

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  agent_id?: string;
  agent_name?: string;
  job_id?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityResponse {
  data: ActivityItem[];
  total: number;
  updated_at: string;
}

// ---- Token ----

export interface TokenStats {
  token_address: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  total_supply_formatted: string;
  holder_count: number | null;
  updated_at: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  balance_formatted: string;
  percentage: number;
}

export interface TokenHoldersResponse {
  holders: TokenHolder[];
  total_supply: string;
  total_supply_formatted: string;
  holder_count: number;
  updated_at: string;
}

// ---- Escrow ----

export interface EscrowStats {
  total_escrowed: string;
  total_released: string;
  job_count: number;
  updated_at: string;
}

// ---- Dashboard ----

export interface DashboardSummary {
  total_agents: number;
  open_jobs: number;
  completed_jobs: number;
  total_rewards_paid: number;
  total_rewards_escrowed: number;
  token_supply: string;
  holder_count: number;
  /** Recent activity feed — included so the LiveActivityFeed can poll
   *  our cached /api/dashboard instead of hitting upstream directly. */
  activity?: ActivityItem[];
}

// ---- API Error ----

export interface ApiError {
  error: string;
  message: string;
  status: number;
}
