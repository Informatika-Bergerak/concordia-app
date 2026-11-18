CREATE TABLE "ForumPostMention" (
  "id" SERIAL NOT NULL,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumPostMention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ForumPostMention_postId_userId_key" ON "ForumPostMention"("postId", "userId");
CREATE INDEX "ForumPostMention_userId_idx" ON "ForumPostMention"("userId");

ALTER TABLE "ForumPostMention" ADD CONSTRAINT "ForumPostMention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPostMention" ADD CONSTRAINT "ForumPostMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
