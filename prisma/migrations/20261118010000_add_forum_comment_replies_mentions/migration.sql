ALTER TABLE "ForumComment" ADD COLUMN "parentId" INTEGER;

CREATE TABLE "ForumCommentMention" (
  "id" SERIAL NOT NULL,
  "commentId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumCommentMention_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ForumComment_postId_parentId_createdAt_idx" ON "ForumComment"("postId", "parentId", "createdAt");
CREATE UNIQUE INDEX "ForumCommentMention_commentId_userId_key" ON "ForumCommentMention"("commentId", "userId");
CREATE INDEX "ForumCommentMention_userId_idx" ON "ForumCommentMention"("userId");

ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumCommentMention" ADD CONSTRAINT "ForumCommentMention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumCommentMention" ADD CONSTRAINT "ForumCommentMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
