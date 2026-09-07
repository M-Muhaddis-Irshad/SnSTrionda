-- AlterTable: Add imageUrl to ChatMessage
ALTER TABLE "ChatMessage" ADD COLUMN "imageUrl" TEXT;

-- CreateTable: BrandStory
CREATE TABLE "BrandStory" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Our Story',
    "heading" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Read More',
    "ctaHref" TEXT NOT NULL DEFAULT '/about',
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BrandStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NewsletterSubscriber
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique email for newsletter
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");