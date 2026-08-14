-- CreateTable
CREATE TABLE "this_day_in_history" (
    "id" TEXT NOT NULL,
    "month_day" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "word_count" INTEGER,
    "share_slug" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'verified',
    "quality_score" INTEGER,
    "date_last_shown" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "this_day_in_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "this_day_in_history_share_slug_key" ON "this_day_in_history"("share_slug");

-- CreateIndex
CREATE INDEX "this_day_in_history_month_day_idx" ON "this_day_in_history"("month_day");
