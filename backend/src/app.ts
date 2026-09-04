import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import healthRoutes from "./features/health/health.routes";
import authRoutes from "./features/auth/auth.routes";
import productRoutes from "./features/products/products.routes";
import measurementRoutes from "./features/measurements/measurements.routes";
import orderRoutes from "./features/orders/orders.routes";
import paymentRoutes from "./features/payments/payments.routes";
import adminRoutes from "./features/admin/admin.routes";
import userRoutes from "./features/users/users.routes";
import deliveryRoutes from "./features/delivery/delivery.routes";
import reviewRoutes from "./features/reviews/reviews.routes";
import chatRoutes from "./features/chat/chat.routes";
import notificationRoutes from "./features/notifications/notifications.routes";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use((req, res, next) => {
  // The webhook route uses express.raw() for signature verification —
  // skip express.json() so the body stream is available for raw parsing.
  if (req.method === "POST" && req.path === "/api/payments/safepay/webhook") {
    return next();
  }
  express.json()(req, res, next);
});

// ---------------------------------------------------------------------------
// Rate limiting — applied to every /api/* route (brute-force protection).
// Registered here (before the routes) so it actually runs. The Safepay
// webhook is exempt: it is a server-to-server callback from the payment
// provider and its body is consumed raw by the route handler.
// ---------------------------------------------------------------------------
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) =>
      req.method === "POST" && req.path === "/api/payments/safepay/webhook",
  })
);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/delivery-zones", deliveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;
