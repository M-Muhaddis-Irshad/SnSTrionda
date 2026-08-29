import "dotenv/config";
import express from "express";
import cors from "cors";
import { productRoutes } from "./src/features/products/products.routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);

const server = app.listen(5099, async () => {
  try {
    const res = await fetch("http://localhost:5099/api/products?limit=1");
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data).substring(0, 800));
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
