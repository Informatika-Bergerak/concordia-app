CREATE TABLE "AdminNews" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminNews_createdAt_idx" ON "AdminNews"("createdAt");
CREATE INDEX "AdminNews_authorId_idx" ON "AdminNews"("authorId");

ALTER TABLE "AdminNews" ADD CONSTRAINT "AdminNews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
