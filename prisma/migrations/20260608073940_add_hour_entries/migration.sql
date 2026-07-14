-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE 'personal';

-- CreateTable
CREATE TABLE "HourEntry" (
    "id" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,

    CONSTRAINT "HourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HourEntry_dailyReportId_idx" ON "HourEntry"("dailyReportId");

-- CreateIndex
CREATE UNIQUE INDEX "HourEntry_dailyReportId_hour_key" ON "HourEntry"("dailyReportId", "hour");

-- AddForeignKey
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
