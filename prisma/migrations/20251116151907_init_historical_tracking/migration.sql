-- CreateTable
CREATE TABLE "prediction_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "event_title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "snapshot_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "close_date" DATETIME NOT NULL,
    "probability" REAL NOT NULL,
    "impact_score" INTEGER NOT NULL,
    "vix_correlation" REAL,
    "sources" TEXT NOT NULL,
    "source_count" INTEGER NOT NULL DEFAULT 0,
    "confidence" REAL,
    "tags" TEXT
);

-- CreateTable
CREATE TABLE "event_resolutions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "event_title" TEXT NOT NULL,
    "resolved_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" BOOLEAN NOT NULL,
    "notes" TEXT,
    "final_probability" REAL,
    "brier_score" REAL,
    "calibration_error" REAL,
    "total_snapshots" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "prediction_snapshots_event_id_idx" ON "prediction_snapshots"("event_id");

-- CreateIndex
CREATE INDEX "prediction_snapshots_snapshot_date_idx" ON "prediction_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "prediction_snapshots_category_idx" ON "prediction_snapshots"("category");

-- CreateIndex
CREATE INDEX "prediction_snapshots_close_date_idx" ON "prediction_snapshots"("close_date");

-- CreateIndex
CREATE UNIQUE INDEX "event_resolutions_event_id_key" ON "event_resolutions"("event_id");

-- CreateIndex
CREATE INDEX "event_resolutions_event_id_idx" ON "event_resolutions"("event_id");

-- CreateIndex
CREATE INDEX "event_resolutions_resolved_date_idx" ON "event_resolutions"("resolved_date");
