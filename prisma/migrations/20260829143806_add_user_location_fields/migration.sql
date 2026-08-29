-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastKnownRegion" TEXT,
ADD COLUMN     "lastLatitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "lastLongitude" DOUBLE PRECISION,
ADD COLUMN     "locationVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_lastLatitude_lastLongitude_idx" ON "users"("lastLatitude", "lastLongitude");
