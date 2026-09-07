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
import { couponPublicRoutes } from "./features/coupons/coupon.routes";
import { discountPublicRoutes } from "./features/discounts/discount.routes";
import { collectionPublicRoutes } from "./features/collections/collection.routes";
import { settingPublicRoutes } from "./features/settings/setting.routes";
import landingRoutes from "./features/landing/landing.routes";
import brandStoryRoutes from "./features/brand-story/brand-story.routes";
import newsletterRoutes from "./features/newsletter/newsletter.routes";
import { campaignPublicRoutes } from "./features/admin/campaign.routes";
import { getAllowedOrigins } from "./config/corsOrigins";

const app = express();

// Trust the first proxy hop (Render/Vercel put the app behind a proxy).
// Without this, req.ip is the proxy's IP — every user shares one address and
// the rate limiter treats the whole site as a single client.
app.set("trust proxy", 1);

// Middleware — allow every configured frontend origin (CORS_ORIGIN may be a
// comma-separated list: localhost dev + Vercel production) plus common dev
// ports. Requests without an Origin header (curl, health checks, same-origin)
// are allowed too.
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

app.use((req, res, next) => {
  // The webhook route uses express.raw() for signature verification —
  // skip express.json() so the body stream is available for raw parsing.
  if (req.method === "POST" && req.path === "/api/payments/safepay/webhook") {
    return next();
  }
  express.json()(req, res, next);
});

// ---------------------------------------------------------------------------
// Rate limiting.
//
// 1. Strict brute-force protection on credential endpoints only (login,
//    register, google, refresh) — 20 tries per 15 min per IP.
// 2. A generous general limiter for the remaining /api/* routes. Authenticated
//    requests (valid Bearer token — e.g. the whole admin panel and customer
//    account flows) are SKIPPED entirely: they are already gated by JWT, and
//    admin pages legitimately fire many requests (product pickers, search,
//    image uploads) that must never hit a 429. The Safepay webhook is exempt
//    too: it is a server-to-server callback consumed raw by the handler.
// ---------------------------------------------------------------------------
app.use(
  "/api/auth/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again later." },
    skip: (req) => !!req.headers.authorization?.startsWith("Bearer "),
  })
);

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 anonymous requests per window per IP
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => {
      if (req.method === "POST" && req.path === "/api/payments/safepay/webhook") {
        return true;
      }
      return !!req.headers.authorization?.startsWith("Bearer ");
    },
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
app.use("/api/coupons", couponPublicRoutes);
app.use("/api/discounts", discountPublicRoutes);
app.use("/api/collections", collectionPublicRoutes);
app.use("/api/settings", settingPublicRoutes);
app.use("/api/landing", landingRoutes);
app.use("/api/brand-story", brandStoryRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/campaigns", campaignPublicRoutes);

export default app;
