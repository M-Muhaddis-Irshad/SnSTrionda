import "dotenv/config";
import jwt from "jsonwebtoken";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import fs from "fs";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

(async () => {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.log("NO ADMIN");
    process.exit(1);
  }
  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role, type: "access" },
    process.env.JWT_SECRET!,
    { expiresIn: "2h" }
  );
  fs.writeFileSync("C:/Users/muhad/Desktop/SnSTrionda/.admin-token.tmp", token);
  console.log("ADMIN_ID=" + admin.id + " EMAIL=" + admin.email);
  await prisma.$disconnect();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});