import { prisma } from "../src/db";

async function main() {
  console.log("🔌 Testing connection to Neon database...\n");

  // CREATE — Insert a ConnectionTest row
  const newRecord = await prisma.connectionTest.create({
    data: {},
  });
  console.log("✅ CREATED:", newRecord);

  // READ — Read it back
  const foundRecord = await prisma.connectionTest.findUnique({
    where: { id: newRecord.id },
  });
  console.log("✅ READ BACK:", foundRecord);

  // Verify the data matches
  if (foundRecord && foundRecord.id === newRecord.id) {
    console.log("\n🎉 SUCCESS: Read/Write operations work against Neon database!");
  } else {
    console.error("\n❌ FAILED: Read data doesn't match created data");
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
