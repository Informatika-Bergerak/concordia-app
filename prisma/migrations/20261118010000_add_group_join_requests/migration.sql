-- CreateEnum
CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('PENDING', 'REJECTED');

-- CreateTable
CREATE TABLE "GroupJoinRequest" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupJoinRequest_groupId_userId_key" ON "GroupJoinRequest"("groupId", "userId");
CREATE INDEX "GroupJoinRequest_groupId_status_idx" ON "GroupJoinRequest"("groupId", "status");
CREATE INDEX "GroupJoinRequest_userId_status_idx" ON "GroupJoinRequest"("userId", "status");

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
