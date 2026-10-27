-- CreateEnum
CREATE TYPE "ProvisioningStatus" AS ENUM ('NOT_STARTED', 'CREATING', 'PROVISIONING', 'INSTALLING_DEPENDENCIES', 'STARTING_PREVIEW', 'CHECKING_PREVIEW', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "provisioningCompletedAt" TIMESTAMP(3),
ADD COLUMN     "provisioningError" TEXT,
ADD COLUMN     "provisioningMessage" TEXT,
ADD COLUMN     "provisioningStartedAt" TIMESTAMP(3),
ADD COLUMN     "provisioningStatus" "ProvisioningStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateIndex
CREATE INDEX "Project_provisioningStatus_idx" ON "Project"("provisioningStatus");
