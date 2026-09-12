import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer DIRECT (unpooled) connection for Prisma CLI commands (migrations, db push)
    // Falls back to DATABASE_URL if DATABASE_URL_UNPOOLED is not set
    url:
      (globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> };
      }).process?.env?.["DATABASE_URL_UNPOOLED"] ||
      (globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> };
      }).process?.env?.["DATABASE_URL"],
  },
});
