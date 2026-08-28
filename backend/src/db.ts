import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Create the Neon adapter with the pooled connection string
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

// Instantiate Prisma Client with the Neon adapter
export const prisma = new PrismaClient({ adapter });
