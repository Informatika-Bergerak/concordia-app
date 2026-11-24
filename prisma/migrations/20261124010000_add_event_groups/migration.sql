ALTER TABLE "Event" ADD COLUMN "groupId" INTEGER;
ALTER TABLE "Event" ADD CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Event_groupId_idx" ON "Event"("groupId");