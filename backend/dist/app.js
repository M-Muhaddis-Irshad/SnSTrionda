"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const health_routes_1 = __importDefault(require("./features/health/health.routes"));
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use("/api/health", health_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map