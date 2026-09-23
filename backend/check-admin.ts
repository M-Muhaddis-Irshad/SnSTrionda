// Verify the super admin is set up: check the dedicated SuperAdmin table and
// the shadow User row, provisioning any missing piece from the environment
// (ADMIN_EMAIL / ADMIN_PASSWORD).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./src/db";

declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

async function main() {
  console.log("Connecting to database...");

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
  }

  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
  const shadow = await prisma.user.findUnique({ where: { email } });

  if (superAdmin && shadow?.role === "SUPER_ADMIN") {
    console.log("Super admin is fully configured:");
    console.log(" - SuperAdmin table:", superAdmin.email);
    console.log(" - Shadow user:", shadow.email, shadow.role);
    await prisma.$disconnect();
    return;
  }

  console.log("Super admin not fully configured. Provisioning...");
  const passwordHash = await bcrypt.hash(password, 12);

  const sa = await prisma.superAdmin.upsert({
    where: { email },
    update: { password: passwordHash, name: "Admin User" },
    create: { email, password: passwordHash, name: "Admin User" },
  });

  const usr = await prisma.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", password: null },
    create: {
      email,
      name: "Admin User",
      role: "SUPER_ADMIN",
      password: null,
    },
  });

  console.log("Super admin configured:", sa.email);
  console.log("Shadow user:", usr.email, usr.role);
  console.log("Login with:", email);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});