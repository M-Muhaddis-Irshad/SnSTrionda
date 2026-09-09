import dotenv from "dotenv";
import app from "./app";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket server: ${process.env.SOCKET_SERVER_URL || "not configured"}`);
  console.log("🛡️  Rate limiting active on /api/* (300 req / 15 min)");
});
