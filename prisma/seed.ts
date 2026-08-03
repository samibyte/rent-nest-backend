import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Apartment", description: "Self-contained unit within a larger building" },
  { name: "House", description: "Standalone residential property" },
  { name: "Studio", description: "Single-room unit with combined living and sleeping area" },
  { name: "Duplex", description: "Two-floor residential unit sharing one building" },
  { name: "Villa", description: "Spacious luxury property, often with private outdoor space" },
  { name: "Penthouse", description: "Top-floor luxury apartment with premium amenities" },
  { name: "Room", description: "A single room within a shared property" },
  { name: "Office Space", description: "Commercial space suitable for business operations" },
  { name: "Shop / Retail", description: "Commercial unit for retail or storefront use" },
  { name: "Warehouse", description: "Large commercial or industrial storage space" },
];

const regions = [
  { name: "Dhaka" },
  { name: "Chittagong" },
  { name: "Rajshahi" },
  { name: "Khulna" },
  { name: "Barishal" },
  { name: "Sylhet" },
  { name: "Rangpur" },
  { name: "Mymensingh" },
];

async function main() {
  console.log("🌱 Seeding categories...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`  ✔ ${category.name}`);
  }

  console.log("🌱 Seeding regions...");

  for (const region of regions) {
    await prisma.region.upsert({
      where: { name: region.name },
      update: {},
      create: region,
    });
    console.log(`  ✔ ${region.name}`);
  }
  const adminEmail = process.env.ADMIN_EMAIL || "admin@rentnest.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  console.log(`🌱 Seeding admin user (${adminEmail})...`);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: "Admin",
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      name: "Admin",
    },
  });

  console.log(`\n✅ Done — ${categories.length} categories and admin user seeded.`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
