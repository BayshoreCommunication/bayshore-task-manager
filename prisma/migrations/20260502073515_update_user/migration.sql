/*
  Warnings:

  - You are about to drop the column `employeeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `jobDescription` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sessionVersion` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `User` table. All the data in the column will be lost.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'o_level', 'manager', 'assistant_manager', 'executive');

-- DropIndex
DROP INDEX "User_employeeId_key";

-- DropIndex
DROP INDEX "User_userName_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "employeeId",
DROP COLUMN "image",
DROP COLUMN "isActive",
DROP COLUMN "jobDescription",
DROP COLUMN "jobTitle",
DROP COLUMN "sessionVersion",
DROP COLUMN "type",
DROP COLUMN "userName",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "department" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "designation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "muted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsibilities" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'executive',
ALTER COLUMN "email" SET NOT NULL;

-- DropEnum
DROP TYPE "UserType";
