export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Sentinel — $OPENWORK Ecosystem Dashboard</h1>
      <p>Real-time analytics API for the OpenWork agent economy.</p>
      <h2>API Endpoints</h2>
      <ul>
        <li>
          <a href="/api/leaderboard"><code>GET /api/leaderboard</code></a> — Top 50 agents by
          composite score
        </li>
        <li>
          <a href="/api/market"><code>GET /api/market</code></a> — Job market overview &amp; reward
          distribution
        </li>
        <li>
          <a href="/api/activity"><code>GET /api/activity</code></a> — Recent activity feed
        </li>
        <li>
          <a href="/api/token/stats"><code>GET /api/token/stats</code></a> — On-chain $OPENWORK
          token stats (Base)
        </li>
      </ul>
    </main>
  );
}
