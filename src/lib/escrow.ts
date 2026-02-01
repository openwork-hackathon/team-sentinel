// ============================================================
// Openwork Escrow Reads
// totalEscrowed · totalReleased · jobCount · getJob
// ============================================================

import { formatUnits } from "viem";
import { getClient, ESCROW_ADDRESS } from "./chain";
import { escrowAbi } from "./abi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum JobStatus {
  Created = 0,
  Assigned = 1,
  Completed = 2,
  Disputed = 3,
  Cancelled = 4,
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.Created]: "Created",
  [JobStatus.Assigned]: "Assigned",
  [JobStatus.Completed]: "Completed",
  [JobStatus.Disputed]: "Disputed",
  [JobStatus.Cancelled]: "Cancelled",
};

export interface EscrowJob {
  id: bigint;
  employer: string;
  worker: string;
  amount: bigint;
  amountFormatted: string;
  status: JobStatus;
  statusLabel: string;
  createdAt: bigint;
  completedAt: bigint;
}

export interface EscrowStats {
  totalEscrowed: bigint;
  totalEscrowedFormatted: string;
  totalReleased: bigint;
  totalReleasedFormatted: string;
  jobCount: bigint;
  updatedAt: string;
}

import { TOKEN_DECIMALS } from "./constants";

// ---------------------------------------------------------------------------
// Escrow aggregate stats (multicall)
// ---------------------------------------------------------------------------

export async function getEscrowStats(): Promise<EscrowStats> {
  const client = getClient();

  const results = await client.multicall({
    contracts: [
      { address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "totalEscrowed" },
      { address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "totalReleased" },
      { address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "jobCount" },
    ],
  });

  const totalEscrowed = results[0].status === "success" ? (results[0].result as bigint) : 0n;
  const totalReleased = results[1].status === "success" ? (results[1].result as bigint) : 0n;
  const jobCount = results[2].status === "success" ? (results[2].result as bigint) : 0n;

  return {
    totalEscrowed,
    totalEscrowedFormatted: formatUnits(totalEscrowed, TOKEN_DECIMALS),
    totalReleased,
    totalReleasedFormatted: formatUnits(totalReleased, TOKEN_DECIMALS),
    jobCount,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Single job read
// ---------------------------------------------------------------------------

export async function getJob(jobId: bigint): Promise<EscrowJob | null> {
  const client = getClient();

  try {
    const result = await client.readContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "getJob",
      args: [jobId],
    });

    const job = result as {
      id: bigint;
      employer: string;
      worker: string;
      amount: bigint;
      status: number;
      createdAt: bigint;
      completedAt: bigint;
    };

    const status = job.status as JobStatus;

    return {
      id: job.id,
      employer: job.employer,
      worker: job.worker,
      amount: job.amount,
      amountFormatted: formatUnits(job.amount, TOKEN_DECIMALS),
      status,
      statusLabel: JOB_STATUS_LABELS[status] ?? `Unknown(${status})`,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Recent jobs (batch via multicall)
// ---------------------------------------------------------------------------

export async function getRecentJobs(count: number = 10): Promise<EscrowJob[]> {
  const stats = await getEscrowStats();
  const total = Number(stats.jobCount);
  if (total === 0) return [];

  const start = Math.max(0, total - count);
  const client = getClient();

  const calls = [];
  for (let i = total - 1; i >= start; i--) {
    calls.push({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "getJob" as const,
      args: [BigInt(i)],
    });
  }

  const results = await client.multicall({ contracts: calls });
  const jobs: EscrowJob[] = [];

  for (const r of results) {
    if (r.status !== "success") continue;

    const job = r.result as {
      id: bigint;
      employer: string;
      worker: string;
      amount: bigint;
      status: number;
      createdAt: bigint;
      completedAt: bigint;
    };

    const status = job.status as JobStatus;

    jobs.push({
      id: job.id,
      employer: job.employer,
      worker: job.worker,
      amount: job.amount,
      amountFormatted: formatUnits(job.amount, TOKEN_DECIMALS),
      status,
      statusLabel: JOB_STATUS_LABELS[status] ?? `Unknown(${status})`,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  }

  return jobs;
}
