// =============================================================================
// CORS Origins — shared by Express (app.ts) and Socket.IO (sockets/index.ts)
// =============================================================================
// Accepts a comma-separated CORS_ORIGIN env (multiple frontend domains, e.g.
// local dev + Vercel production) plus the common localhost dev ports so local
// work never trips CORS regardless of which port Next.js picks.
// =============================================================================

const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:3006",
  "http://localhost:3007",
  "http://127.0.0.1:3000",
];

export function getAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return Array.from(new Set([...configured, ...DEV_ORIGINS]));
}