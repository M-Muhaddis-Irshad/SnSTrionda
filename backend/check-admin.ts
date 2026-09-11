import { PrismaClient } from './src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

// For resolving process error
declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

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
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPass) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    }
    
    const hashedPassword = await bcrypt.hash(adminPass, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '03001234567',
      },
    });
    console.log('Admin created:', admin.email, admin.name, admin.role);
    console.log('Login with:', adminEmail);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
