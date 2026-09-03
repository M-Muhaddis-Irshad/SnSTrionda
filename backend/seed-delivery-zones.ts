// =============================================================================
// Seed Delivery Zones (Pakistan) — idempotent upserts by city name
// Run with: npx tsx seed-delivery-zones.ts
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ZONES: Array<{
  name: string;
  latitude: number;
  longitude: number;
  deliveryCharges: number;
  estimatedDays: number;
}> = [
  { name: "Karachi", latitude: 24.8607, longitude: 67.0011, deliveryCharges: 300, estimatedDays: 2 },
  { name: "Lahore", latitude: 31.5497, longitude: 74.3436, deliveryCharges: 250, estimatedDays: 2 },
  { name: "Islamabad", latitude: 33.6844, longitude: 73.1566, deliveryCharges: 300, estimatedDays: 2 },
  { name: "Rawalpindi", latitude: 33.5731, longitude: 73.1367, deliveryCharges: 300, estimatedDays: 2 },
  { name: "Multan", latitude: 30.1575, longitude: 71.4247, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Faisalabad", latitude: 31.4181, longitude: 72.311, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Peshawar", latitude: 34.0151, longitude: 71.5249, deliveryCharges: 400, estimatedDays: 3 },
  { name: "Quetta", latitude: 30.1798, longitude: 67.0152, deliveryCharges: 500, estimatedDays: 4 },
  { name: "Sialkot", latitude: 32.4945, longitude: 74.5229, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Gujranwala", latitude: 32.1877, longitude: 74.1945, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Hyderabad", latitude: 25.396, longitude: 68.3578, deliveryCharges: 300, estimatedDays: 3 },
  { name: "Sargodha", latitude: 32.0836, longitude: 72.6711, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Bahawalpur", latitude: 29.3956, longitude: 71.6836, deliveryCharges: 400, estimatedDays: 3 },
  { name: "Sukkur", latitude: 27.7052, longitude: 68.8574, deliveryCharges: 400, estimatedDays: 4 },
  { name: "Larkana", latitude: 27.5498, longitude: 68.2145, deliveryCharges: 400, estimatedDays: 4 },
  { name: "Abbottabad", latitude: 34.1688, longitude: 73.2215, deliveryCharges: 400, estimatedDays: 3 },
  { name: "Mardan", latitude: 34.1989, longitude: 72.0231, deliveryCharges: 400, estimatedDays: 3 },
  { name: "Gujrat", latitude: 32.5742, longitude: 74.0754, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Sheikhupura", latitude: 31.7167, longitude: 73.985, deliveryCharges: 350, estimatedDays: 3 },
  { name: "Mirpur Khas", latitude: 25.5276, longitude: 69.0111, deliveryCharges: 450, estimatedDays: 4 },
];

async function main() {
  let created = 0;
  for (const zone of ZONES) {
    const existing = await prisma.deliveryZone.findUnique({ where: { name: zone.name } });
    if (existing) {
      await prisma.deliveryZone.update({
        where: { name: zone.name },
        data: zone,
      });
    } else {
      await prisma.deliveryZone.create({ data: zone });
      created++;
    }
  }
  const total = await prisma.deliveryZone.count();
  console.log(`✅ Delivery zones seeded — ${created} new, ${ZONES.length - created} updated, ${total} total.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed delivery zones failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });