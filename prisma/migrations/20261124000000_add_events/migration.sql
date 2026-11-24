CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Event" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endDate" DATE NOT NULL,
  "endTime" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "groupName" TEXT,
  "category" TEXT NOT NULL,
  "coverImage" TEXT,
  "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
  "creatorId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "EventParticipant" (
  "eventId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("eventId", "userId"),
  CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EventInterest" (
  "eventId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventInterest_pkey" PRIMARY KEY ("eventId", "userId"),
  CONSTRAINT "EventInterest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Event_creatorId_idx" ON "Event"("creatorId");
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");
CREATE INDEX "EventParticipant_userId_idx" ON "EventParticipant"("userId");
CREATE INDEX "EventInterest_userId_idx" ON "EventInterest"("userId");