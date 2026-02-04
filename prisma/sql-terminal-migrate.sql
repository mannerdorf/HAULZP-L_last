-- Выполните в SQL Editor Neon или в psql. Идемпотентно — можно запускать повторно.

-- ManualExpense: комментарий
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ManualExpense' AND column_name = 'comment') THEN
    ALTER TABLE "ManualExpense" ADD COLUMN "comment" TEXT;
  END IF;
END $$;

-- ManualRevenue: направление и паром/авто (доходы)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ManualRevenue' AND column_name = 'direction') THEN
    ALTER TABLE "ManualRevenue" ADD COLUMN "direction" TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ManualRevenue' AND column_name = 'transportType') THEN
    ALTER TABLE "ManualRevenue" ADD COLUMN "transportType" TEXT NOT NULL DEFAULT '';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ManualRevenue_period_categoryId_key') THEN
    DROP INDEX IF EXISTS "ManualRevenue_period_categoryId_key";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ManualRevenue_period_categoryId_direction_transportType_key') THEN
    CREATE UNIQUE INDEX "ManualRevenue_period_categoryId_direction_transportType_key" ON "ManualRevenue"("period", "categoryId", "direction", "transportType");
  END IF;
END $$;

-- ManualExpense: направление и паром/авто (магистраль)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ManualExpense' AND column_name = 'direction') THEN
    ALTER TABLE "ManualExpense" ADD COLUMN "direction" TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ManualExpense' AND column_name = 'transportType') THEN
    ALTER TABLE "ManualExpense" ADD COLUMN "transportType" TEXT NOT NULL DEFAULT '';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ManualExpense_period_categoryId_key') THEN
    DROP INDEX IF EXISTS "ManualExpense_period_categoryId_key";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ManualExpense_period_categoryId_direction_transportType_key') THEN
    CREATE UNIQUE INDEX "ManualExpense_period_categoryId_direction_transportType_key" ON "ManualExpense"("period", "categoryId", "direction", "transportType");
  END IF;
END $$;
