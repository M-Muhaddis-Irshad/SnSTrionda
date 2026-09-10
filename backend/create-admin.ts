// Create admin user for testing
import { prisma } from "./src/db";
import bcrypt from "bcryptjs";

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "s.ntriondawear7@gmail.com";
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

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "SN_WEARS09@", 12);
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
