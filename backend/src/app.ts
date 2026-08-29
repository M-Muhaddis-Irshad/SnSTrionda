import express from "express";
import cors from "cors";
import healthRoutes from "./features/health/health.routes";
import authRoutes from "./features/auth/auth.routes";
import productRoutes from "./features/products/products.routes";
import measurementRoutes from "./features/measurements/measurements.routes";
import orderRoutes from "./features/orders/orders.routes";
import paymentRoutes from "./features/payments/payments.routes";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

export default app;
