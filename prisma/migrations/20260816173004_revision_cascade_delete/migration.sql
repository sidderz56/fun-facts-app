-- DropForeignKey
ALTER TABLE "fact_revisions" DROP CONSTRAINT "fact_revisions_fact_id_fkey";

-- AddForeignKey
ALTER TABLE "fact_revisions" ADD CONSTRAINT "fact_revisions_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
