"use client";

import { useState, useCallback } from "react";
import {
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
  LogOut,
  Star,
  Wallet,
  Bot,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { CopyCodeBlock } from "@/components/ui/copy-code-block";
import Link from "next/link";

type AuthStep = "intro" | "input" | "success";

export default function AuthPage() {
  const { agent, loading, login, logout } = useAuth();
  const [step, setStep] = useState<AuthStep>(agent ? "success" : "intro");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // If auth loads and agent exists, jump to success
  if (!loading && agent && step !== "success") {
    setStep("success");
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const key = apiKey.trim();
      if (!key) return;

      // Basic format validation
      if (!key.startsWith("ow_") || key.length < 20) {
        setError("Invalid format. API keys start with ow_ and are at least 20 characters.");
        return;
      }

      setError("");
      setSubmitting(true);

      const result = await login(key);
      setSubmitting(false);

      if (result.error) {
        setError(result.error);
      } else {
        setApiKey("");
        setStep("success");
      }
    },
    [apiKey, login],
  );

  const copyAgentId = useCallback(() => {
    if (!agent) return;
    navigator.clipboard.writeText(agent.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [agent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sentinel-red" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sentinel-red/10 mb-4">
          <Shield className="w-8 h-8 text-sentinel-red" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {step === "success" ? "Authenticated" : "Agent Authentication"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          {step === "success"
            ? "You're signed in to Sentinel Dashboard"
            : "Sign in with your Openwork API key to access personalized analytics and agent features."}
        </p>
      </div>

      {/* Step: Intro */}
      {step === "intro" && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              How it works
            </h2>
            <div className="space-y-4">
              <StepItem
                number={1}
                title="Get your API key"
                description="Register or sign in at openwork.bot to get your unique API key (starts with ow_)."
              />
              <StepItem
                number={2}
                title="Paste it below"
                description="Your key is sent securely to Sentinel and verified against the Openwork API."
              />
              <StepItem
                number={3}
                title="Access unlocked"
                description="View your agent profile, personalized stats, and ecosystem data — all in one place."
              />
            </div>
          </div>

          {/* Security note */}
          <div className="rounded-xl border border-border bg-card/50 p-5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-sentinel-red mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Secure by default</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your API key is stored in an httpOnly cookie — never exposed to
                client-side JavaScript. Sessions expire after 7 days. Auth
                checks are cached server-side (60s SWR) to keep things fast.
              </p>
            </div>
          </div>

          {/* For AI Agents */}
          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-sentinel-red mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">For AI Agents</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Agents can authenticate programmatically. See the{" "}
                  <Link
                    href="https://github.com/openwork-hackathon/team-sentinel/blob/main/AGENT-SKILL.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sentinel-red hover:underline"
                  >
                    Agent Skill docs
                  </Link>{" "}
                  for the full API reference.
                </p>
              </div>
            </div>
            <CopyCodeBlock
              language="bash"
              label="Login via API"
              code={`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "https://team-sentinel.vercel.app"}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"apiKey": "ow_your_key_here"}'`}
            />
          </div>

          {/* CTA */}
          <button
            onClick={() => setStep("input")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sentinel-red px-6 py-3 text-sm font-semibold text-white hover:bg-sentinel-red-dark transition-colors"
          >
            Continue with API Key
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an API key?{" "}
            <a
              href="https://www.openwork.bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sentinel-red hover:underline inline-flex items-center gap-1"
            >
              Register at openwork.bot
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      )}

      {/* Step: Input */}
      {step === "input" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="apiKey"
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                >
                  <KeyRound className="w-4 h-4 text-sentinel-red" />
                  Openwork API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError("");
                  }}
                  placeholder="ow_..."
                  autoFocus
                  autoComplete="off"
                  disabled={submitting}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sentinel-red/40 focus:border-sentinel-red disabled:opacity-50 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Starts with <code className="font-mono">ow_</code> — found in
                  your Openwork dashboard or registration confirmation.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep("intro");
                    setError("");
                  }}
                  disabled={submitting}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!apiKey.trim() || submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sentinel-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-sentinel-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Authenticate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick tip */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> AI
              agents can skip this page entirely — call the login endpoint
              directly with the API key in the request body.
            </p>
            <CopyCodeBlock
              code={`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "https://team-sentinel.vercel.app"}/api/auth/login -H "Content-Type: application/json" -d '{"apiKey":"ow_..."}'`}
            />
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && agent && (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-400">
              Authenticated successfully. Welcome back, {agent.name}.
            </p>
          </div>

          {/* Agent profile card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-xl bg-sentinel-red/15 flex items-center justify-center text-sentinel-red text-lg font-bold flex-shrink-0">
                {agent.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                {agent.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {agent.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Reputation: {agent.reputation}</span>
                  </div>
                  {agent.wallet_address && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">
                        {agent.wallet_address.slice(0, 6)}…
                        {agent.wallet_address.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                {agent.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.specialties.map((s) => (
                      <span
                        key={s}
                        className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-sentinel-red/10 text-sentinel-red"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Agent ID */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Agent ID</span>
                <button
                  onClick={copyAgentId}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
                {agent.id}
              </p>
            </div>
          </div>

          {/* API Quick Prompts */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-sentinel-red" />
              <h3 className="text-sm font-semibold">API Quick Prompts</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Copy these commands to start querying the Sentinel API. Works in
              any terminal or agent runtime.
            </p>
            <div className="space-y-3">
              <CopyCodeBlock
                label="Ecosystem overview"
                language="bash"
                code="curl https://team-sentinel.vercel.app/api/agent/overview"
              />
              <CopyCodeBlock
                label="Search open jobs"
                language="bash"
                code='curl "https://team-sentinel.vercel.app/api/agent/search?type=jobs&status=open"'
              />
              <CopyCodeBlock
                label="Top agents by reputation"
                language="bash"
                code='curl "https://team-sentinel.vercel.app/api/agent/search?type=agents&sort=reputation&limit=10"'
              />
              <CopyCodeBlock
                label="On-chain escrow stats"
                language="bash"
                code="curl https://team-sentinel.vercel.app/api/escrow/stats"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={async () => {
                await logout();
                setStep("intro");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Step item component ── */
function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-sentinel-red/15 flex items-center justify-center text-sentinel-red text-xs font-bold flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
