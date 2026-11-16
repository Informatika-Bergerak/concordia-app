-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AddColumn
ALTER TABLE "Group" ADD COLUMN "visibility" "GroupVisibility" NOT NULL DEFAULT 'PRIVATE';

-- Existing groups remain private until their owners explicitly publish them.
