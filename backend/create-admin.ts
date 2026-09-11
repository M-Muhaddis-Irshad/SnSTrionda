// Create admin user for testing
import { prisma } from "./src/db";
import bcrypt from "bcryptjs";
import "dotenv/config";

declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;

  if (!email) {
    throw new Error("ADMIN_EMAIL is required");
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Update to ADMIN role
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log("User updated to ADMIN:", updated.email, updated.role);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", user.email, user.role);
}

createAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));
