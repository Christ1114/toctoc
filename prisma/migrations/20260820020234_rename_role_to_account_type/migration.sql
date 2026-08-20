/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_role_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "accountType" "Role" NOT NULL DEFAULT 'CLIENT';

-- CreateIndex
CREATE INDEX "users_accountType_idx" ON "users"("accountType");
