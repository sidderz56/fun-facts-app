-- CreateEnum
CREATE TYPE "RevisionChangeType" AS ENUM ('created', 'text_edited', 'status_changed', 'retired', 'restored', 'reverified', 'quality_rescored', 'superseded');

-- AlterTable
ALTER TABLE "facts" ALTER COLUMN "verification_status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "this_day_in_history" ALTER COLUMN "verification_status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "fact_revisions" (
    "id" TEXT NOT NULL,
    "fact_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_type" "RevisionChangeType" NOT NULL,
    "previous_text" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "reason" TEXT,
    "actor" TEXT NOT NULL,

    CONSTRAINT "fact_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_revisions_fact_id_idx" ON "fact_revisions"("fact_id");

-- AddForeignKey
ALTER TABLE "fact_revisions" ADD CONSTRAINT "fact_revisions_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "facts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
