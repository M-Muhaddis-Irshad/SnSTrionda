"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./lib/socket");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Create raw HTTP server (required for Socket.IO attachment)
const httpServer = http_1.default.createServer(app_1.default);
// Initialize Socket.IO on the same HTTP server
(0, socket_1.initSocket)(httpServer);
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.IO ready on port ${PORT}`);
});
//# sourceMappingURL=server.js.map