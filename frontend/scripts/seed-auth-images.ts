import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function seedAuthImages() {
  await prisma.authImage.deleteMany();

  const loginImage = await prisma.authImage.create({
    data: {
      pageType: 'login',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop',
    },
  });

  const signupImage = await prisma.authImage.create({
    data: {
      pageType: 'signup',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop',
    },
  });

  console.log('✅ Auth images seeded:', { loginImage, signupImage });
}

seedAuthImages()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
