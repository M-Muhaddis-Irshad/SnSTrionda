import { prisma } from './prisma';

export async function logActivity(
  userId: string,
  type: 'order' | 'product' | 'customer' | 'discount' | 'review',
  message: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
