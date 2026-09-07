import { prisma } from "../../db";

export class NewsletterError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "NewsletterError";
  }
}

export async function subscribe(email: string) {
  if (!email?.trim()) throw new NewsletterError("Email is required.", 400);
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) throw new NewsletterError("Invalid email address.", 400);

  // Upsert: if already subscribed, just return the existing record
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    if (existing.active) return { message: "You are already subscribed!", data: existing };
    // Re-activate if previously unsubscribed
    const reactivated = await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { active: true },
    });
    return { message: "Welcome back! You have been re-subscribed.", data: reactivated };
  }

  const subscriber = await prisma.newsletterSubscriber.create({
    data: { email: normalizedEmail },
  });
  return { message: "Successfully subscribed to the newsletter!", data: subscriber };
}

export async function unsubscribe(email: string) {
  if (!email?.trim()) throw new NewsletterError("Email is required.", 400);
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });
  if (!existing) throw new NewsletterError("Email not found in subscribers.", 404);

  await prisma.newsletterSubscriber.update({
    where: { id: existing.id },
    data: { active: false },
  });
  return { message: "Successfully unsubscribed." };
}

export async function listSubscribers() {
  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
}
