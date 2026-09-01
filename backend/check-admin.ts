import { PrismaClient } from './src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Connecting to database...');
  
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('Admin users found:', admins.length);
  
  for (const a of admins) {
    console.log(' -', a.email, a.name, a.role);
  }

  if (admins.length === 0) {
    console.log('No admin user found. Creating one...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@trionda.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '03001234567',
      },
    });
    console.log('Admin created:', admin.email, admin.name, admin.role);
    console.log('Login with: admin@trionda.com / Admin123!');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
