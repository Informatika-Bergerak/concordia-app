-- CreateTable
CREATE TABLE "ReportSupport" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSupport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportSupport_userId_idx" ON "ReportSupport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSupport_reportId_userId_key" ON "ReportSupport"("reportId", "userId");

-- AddForeignKey
ALTER TABLE "ReportSupport" ADD CONSTRAINT "ReportSupport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSupport" ADD CONSTRAINT "ReportSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
