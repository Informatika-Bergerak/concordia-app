ALTER TABLE "ForumPost"
  ADD COLUMN "tag" TEXT,
  ADD COLUMN "locationLabel" TEXT,
  ADD COLUMN "locationUrl" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "eventTitle" TEXT,
  ADD COLUMN "eventDate" TEXT,
  ADD COLUMN "eventTime" TEXT,
  ADD COLUMN "eventLocation" TEXT,
  ADD COLUMN "eventUrl" TEXT;

CREATE TABLE "ForumPoll" (
  "id" SERIAL NOT NULL,
  "postId" INTEGER NOT NULL,
  "question" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumPoll_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ForumPollOption" (
  "id" SERIAL NOT NULL,
  "pollId" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumPollOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ForumPollVote" (
  "id" SERIAL NOT NULL,
  "pollId" INTEGER NOT NULL,
  "optionId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumPollVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ForumPoll_postId_key" ON "ForumPoll"("postId");
CREATE INDEX "ForumPollOption_pollId_idx" ON "ForumPollOption"("pollId");
CREATE UNIQUE INDEX "ForumPollVote_pollId_userId_key" ON "ForumPollVote"("pollId", "userId");
CREATE INDEX "ForumPollVote_optionId_idx" ON "ForumPollVote"("optionId");
CREATE INDEX "ForumPollVote_userId_idx" ON "ForumPollVote"("userId");

ALTER TABLE "ForumPoll" ADD CONSTRAINT "ForumPoll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPollOption" ADD CONSTRAINT "ForumPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ForumPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPollVote" ADD CONSTRAINT "ForumPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ForumPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPollVote" ADD CONSTRAINT "ForumPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ForumPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPollVote" ADD CONSTRAINT "ForumPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
