-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('draft', 'pending_review', 'verified', 'rejected', 'needs_reverification');

-- CreateEnum
CREATE TYPE "ReverificationCadence" AS ENUM ('none', 'quarterly', 'semiannual', 'annual', 'biennial', 'custom');

-- CreateEnum
CREATE TYPE "FactLengthClass" AS ENUM ('short', 'medium', 'long');

-- CreateEnum
CREATE TYPE "RetiredReason" AS ENUM ('became_false', 'became_ambiguous', 'report_upheld', 'superseded', 'other');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon_asset" TEXT NOT NULL,
    "target_proportion" DOUBLE PRECISION NOT NULL,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facts" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "pattern_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sources" JSONB NOT NULL DEFAULT '[]',
    "word_count" INTEGER,
    "fact_length_class" "FactLengthClass",
    "quality_score" INTEGER,
    "time_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "reverification_cadence" "ReverificationCadence",
    "reverification_due_date" DATE,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'verified',
    "verification_note" TEXT,
    "date_added" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_last_verified" DATE,
    "share_slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retired_reason" "RetiredReason",
    "superseded_by" TEXT,
    "reports_since_review" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "anon_id" TEXT NOT NULL,
    "seen_fact_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_history_fact_shown_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("anon_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "facts_share_slug_key" ON "facts"("share_slug");

-- CreateIndex
CREATE INDEX "facts_category_id_idx" ON "facts"("category_id");

-- AddForeignKey
ALTER TABLE "facts" ADD CONSTRAINT "facts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facts" ADD CONSTRAINT "facts_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "facts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
