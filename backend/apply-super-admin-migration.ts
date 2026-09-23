// One-off script to apply the add_super_admin migration SQL directly to the
// database (this DB was created with `prisma db push`, so it has no migration
// history and `prisma migrate dev` would demand a destructive reset).
import { prisma } from "./src/db";

async function main() {
  const sql = `
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

    CREATE TABLE IF NOT EXISTS "SuperAdmin" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "SuperAdmin_email_key" ON "SuperAdmin"("email");
  `;
  await prisma.$executeRawUnsafe(sql);
  console.log("✅ SuperAdmin table + SUPER_ADMIN role applied");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());