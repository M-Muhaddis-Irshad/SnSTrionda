// Create the store's super admin.
// Credentials (email + hashed password) are stored in the dedicated
// SuperAdmin table; a shadow row (role SUPER_ADMIN, no usable password) is
// kept in the User table so chat / activity / sockets keep working.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./src/db";

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

  const passwordHash = await bcrypt.hash(password, 12);

  // 1. The dedicated SuperAdmin table stores the real credential.
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email },
    update: { password: passwordHash, name: "Admin User" },
    create: { email, password: passwordHash, name: "Admin User" },
  });

  // 2. Shadow User row (no live password) so the admin features that rely on
  //    the User foreign keys (chat, activity feed, sockets) keep working.
  const shadow = await prisma.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", password: null },
    create: {
      email,
      name: "Admin User",
      role: "SUPER_ADMIN",
      password: null,
    },
  });

  console.log("Super admin created:", superAdmin.email);
  console.log("Shadow user ready:", shadow.email, shadow.role);
}

createAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));