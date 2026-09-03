"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const health_routes_1 = __importDefault(require("./features/health/health.routes"));
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const products_routes_1 = __importDefault(require("./features/products/products.routes"));
const measurements_routes_1 = __importDefault(require("./features/measurements/measurements.routes"));
const orders_routes_1 = __importDefault(require("./features/orders/orders.routes"));
const payments_routes_1 = __importDefault(require("./features/payments/payments.routes"));
const admin_routes_1 = __importDefault(require("./features/admin/admin.routes"));
const delivery_routes_1 = __importDefault(require("./features/delivery/delivery.routes"));
const reviews_routes_1 = __importDefault(require("./features/reviews/reviews.routes"));
const chat_routes_1 = __importDefault(require("./features/chat/chat.routes"));
const notifications_routes_1 = __importDefault(require("./features/notifications/notifications.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
}));
app.use((req, res, next) => {
    // The webhook route uses express.raw() for signature verification —
    // skip express.json() so the body stream is available for raw parsing.
    if (req.method === "POST" && req.path === "/api/payments/safepay/webhook") {
        return next();
    }
    express_1.default.json()(req, res, next);
});
// ---------------------------------------------------------------------------
// Rate limiting — applied to every /api/* route (brute-force protection).
// Registered here (before the routes) so it actually runs. The Safepay
// webhook is exempt: it is a server-to-server callback from the payment
// provider and its body is consumed raw by the route handler.
// ---------------------------------------------------------------------------
app.use("/api/", (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => req.method === "POST" && req.path === "/api/payments/safepay/webhook",
}));
// Routes
app.use("/api/health", health_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", products_routes_1.default);
app.use("/api/measurements", measurements_routes_1.default);
app.use("/api/orders", orders_routes_1.default);
app.use("/api/payments", payments_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/delivery-zones", delivery_routes_1.default);
app.use("/api/reviews", reviews_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map