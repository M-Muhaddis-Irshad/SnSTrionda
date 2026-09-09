// CORS Origins — shared by Express (emit bridge) and Socket.IO

const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
];

export function getAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return Array.from(new Set([...configured, ...DEV_ORIGINS]));
}
