import express from "express";
import cors from "cors";
import healthRoutes from "./features/health/health.routes";

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

export default app;
