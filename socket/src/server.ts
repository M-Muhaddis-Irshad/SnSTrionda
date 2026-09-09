// =============================================================================
// Trionda Wears — Standalone Socket.IO Server
// =============================================================================
// Deployed on Render. The backend (Vercel) emits events to this server
// via the POST /emit HTTP bridge. The frontend connects here directly
// for real-time notifications, chat, and admin stats.
// =============================================================================

import dotenv from "dotenv";
import http from "http";
import express from "express";
import cors from "cors";
import { getAllowedOrigins } from "./config/corsOrigins";
import { initSocket } from "./sockets";
import emitRoutes from "./routes/emit";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();

// Trust proxy (Render puts apps behind a proxy)
app.set("trust proxy", 1);

// CORS — allow the frontend and the backend to reach us
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || getAllowedOrigins().includes(origin)) {
        return cb(null, true);
      }
      cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "trionda-socket", timestamp: new Date().toISOString() });
});

// HTTP emit bridge — backend calls this to emit socket events
app.use("/emit", emitRoutes);

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Trionda Socket server running on port ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 Emit bridge: http://localhost:${PORT}/emit`);
});
