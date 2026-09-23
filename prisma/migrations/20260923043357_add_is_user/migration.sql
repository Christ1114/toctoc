/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `rate_limits` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_OFFER', 'PROFILE_VERIFIED', 'INTERVIEW_REMINDER', 'BOOKING_UPDATE', 'REVIEW_RECEIVED', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_sourceId_fkey";

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "isUserGenerated" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "sourceId" DROP NOT NULL,
ALTER COLUMN "externalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "youtube" TEXT;

-- CreateTable
CREATE TABLE "provider_videos" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "thumbnail" TEXT,
    "title" TEXT,
    "description" TEXT,
    "duration" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "data" JSONB,
    "link" TEXT,
    "announcementId" TEXT,
    "bookingId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_videos_providerId_position_idx" ON "provider_videos"("providerId", "position");

-- CreateIndex
CREATE INDEX "provider_videos_providerId_isVisible_idx" ON "provider_videos"("providerId", "isVisible");

-- CreateIndex
CREATE INDEX "notifications_userId_read_createdAt_idx" ON "notifications"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "announcements_isUserGenerated_idx" ON "announcements"("isUserGenerated");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_videos" ADD CONSTRAINT "provider_videos_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
