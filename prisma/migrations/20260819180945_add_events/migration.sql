-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('fact_viewed', 'share_initiated', 'report_submitted', 'exhaustion_hit', 'share_page_arrival');

-- CreateEnum
CREATE TYPE "FactViewSource" AS ENUM ('tile', 'another', 'random', 'share_page');

-- CreateEnum
CREATE TYPE "ExhaustionScope" AS ENUM ('category', 'all');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "anon_id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "share_slug" TEXT,
    "category_slug" TEXT,
    "source" "FactViewSource",
    "exhaustion_scope" "ExhaustionScope",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_anon_id_created_at_idx" ON "events"("anon_id", "created_at");

-- CreateIndex
CREATE INDEX "events_type_created_at_idx" ON "events"("type", "created_at");

-- CreateIndex
CREATE INDEX "events_category_slug_type_idx" ON "events"("category_slug", "type");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_anon_id_fkey" FOREIGN KEY ("anon_id") REFERENCES "sessions"("anon_id") ON DELETE RESTRICT ON UPDATE CASCADE;
