-- Add group reports to the existing report system
ALTER TYPE "ReportCategory" ADD VALUE IF NOT EXISTS 'LAPORAN_GRUP';
ALTER TABLE "Report" ADD COLUMN "groupId" INTEGER;
CREATE INDEX "Report_groupId_idx" ON "Report"("groupId");
ALTER TABLE "Report" ADD CONSTRAINT "Report_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve the group snapshot in report title/description while groupId remains nullable for deleted groups.