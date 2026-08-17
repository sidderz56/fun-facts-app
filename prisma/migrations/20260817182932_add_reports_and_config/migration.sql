-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "fact_id" TEXT NOT NULL,
    "anon_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_rate_limit_events" (
    "id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "reports_fact_id_idx" ON "reports"("fact_id");

-- CreateIndex
CREATE INDEX "reports_anon_id_created_at_idx" ON "reports"("anon_id", "created_at");

-- CreateIndex
CREATE INDEX "report_rate_limit_events_ip_hash_created_at_idx" ON "report_rate_limit_events"("ip_hash", "created_at");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "facts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_anon_id_fkey" FOREIGN KEY ("anon_id") REFERENCES "sessions"("anon_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex (hand-added: spec 3.6's "one open report per anon_id per
-- fact" constraint needs a partial index, which Prisma's schema DSL can't
-- express with `@@unique`. This is the real enforcement; lib/reporting.ts
-- also checks before insert so a duplicate never even reaches this
-- constraint in the normal path — this is the concurrent-request backstop.)
CREATE UNIQUE INDEX "reports_open_fact_anon_key" ON "reports"("fact_id", "anon_id") WHERE "resolved_at" IS NULL;
