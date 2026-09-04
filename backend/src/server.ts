import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { initSocket } from "./sockets";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create raw HTTP server (required for Socket.IO attachment)
const httpServer = http.createServer(app);

// Initialize Socket.IO on the same HTTP server
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.IO ready on port ${PORT}`);
  console.log("🛡️  Rate limiting active on /api/* (100 req / 15 min)");
});
