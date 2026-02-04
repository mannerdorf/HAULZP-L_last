-- Таблицы для Neon (PostgreSQL) — вставьте в SQL Editor: https://console.neon.tech
-- Если таблицы уже есть, выполните один раз или используйте: npx prisma db push

-- CreateTable
CREATE TABLE IF NOT EXISTS "Operation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "counterparty" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "operationType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "logisticsStage" TEXT,
    "direction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Sale" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "client" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "transportType" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "paidWeightKg" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CreditPayment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "counterparty" TEXT NOT NULL,
    "purpose" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IncomeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subdivision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "logisticsStage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subdivision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subdivision_code_key" ON "Subdivision"("code");
CREATE INDEX IF NOT EXISTS "Subdivision_department_idx" ON "Subdivision"("department");

-- CreateTable
CREATE TABLE IF NOT EXISTS "OpeningBalance" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpeningBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OpeningBalance_period_key" ON "OpeningBalance"("period");
CREATE INDEX IF NOT EXISTS "OpeningBalance_period_idx" ON "OpeningBalance"("period");

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "logisticsStage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ManualRevenue" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ManualExpense" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StatementExpense" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "counterparty" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "operationsCount" INTEGER NOT NULL,
    "accounted" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatementExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ClassificationRule" (
    "id" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "purposePattern" TEXT,
    "operationType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "logisticsStage" TEXT,
    "direction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Operation_date_idx" ON "Operation"("date");
CREATE INDEX IF NOT EXISTS "Operation_operationType_idx" ON "Operation"("operationType");
CREATE INDEX IF NOT EXISTS "Operation_department_idx" ON "Operation"("department");
CREATE INDEX IF NOT EXISTS "Operation_direction_idx" ON "Operation"("direction");
CREATE INDEX IF NOT EXISTS "Sale_date_idx" ON "Sale"("date");
CREATE INDEX IF NOT EXISTS "Sale_direction_idx" ON "Sale"("direction");
CREATE INDEX IF NOT EXISTS "CreditPayment_date_idx" ON "CreditPayment"("date");
CREATE INDEX IF NOT EXISTS "CreditPayment_type_idx" ON "CreditPayment"("type");
CREATE INDEX IF NOT EXISTS "ExpenseCategory_department_idx" ON "ExpenseCategory"("department");
CREATE INDEX IF NOT EXISTS "ManualRevenue_period_idx" ON "ManualRevenue"("period");
CREATE UNIQUE INDEX IF NOT EXISTS "ManualRevenue_period_categoryId_key" ON "ManualRevenue"("period", "categoryId");
CREATE INDEX IF NOT EXISTS "ManualExpense_period_idx" ON "ManualExpense"("period");
CREATE UNIQUE INDEX IF NOT EXISTS "ManualExpense_period_categoryId_key" ON "ManualExpense"("period", "categoryId");
CREATE INDEX IF NOT EXISTS "StatementExpense_period_idx" ON "StatementExpense"("period");
CREATE INDEX IF NOT EXISTS "StatementExpense_accounted_idx" ON "StatementExpense"("accounted");
CREATE UNIQUE INDEX IF NOT EXISTS "StatementExpense_period_counterparty_key" ON "StatementExpense"("period", "counterparty");
CREATE UNIQUE INDEX IF NOT EXISTS "ClassificationRule_counterparty_key" ON "ClassificationRule"("counterparty");

-- AddForeignKey (идемпотентно: не падает, если ограничение уже есть)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ManualRevenue_categoryId_fkey') THEN
    ALTER TABLE "ManualRevenue" ADD CONSTRAINT "ManualRevenue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IncomeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ManualExpense_categoryId_fkey') THEN
    ALTER TABLE "ManualExpense" ADD CONSTRAINT "ManualExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StatementExpense_categoryId_fkey') THEN
    ALTER TABLE "StatementExpense" ADD CONSTRAINT "StatementExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Сид подразделений (как в меню). Выполните после создания таблиц, если таблица Subdivision пустая.
INSERT INTO "Subdivision" (id, code, name, department, "logisticsStage", "sortOrder")
VALUES
  (gen_random_uuid()::text, 'pickup_msk', 'Заборная логистика Москва', 'LOGISTICS_MSK', 'PICKUP', 0),
  (gen_random_uuid()::text, 'warehouse_msk', 'Склад Москва', 'LOGISTICS_MSK', 'DEPARTURE_WAREHOUSE', 1),
  (gen_random_uuid()::text, 'mainline', 'Магистраль', 'LOGISTICS_MSK', 'MAINLINE', 2),
  (gen_random_uuid()::text, 'warehouse_kgd', 'Склад Калининград', 'LOGISTICS_KGD', 'ARRIVAL_WAREHOUSE', 3),
  (gen_random_uuid()::text, 'lastmile_kgd', 'Последняя миля Калининград', 'LOGISTICS_KGD', 'LAST_MILE', 4),
  (gen_random_uuid()::text, 'administration', 'Администрация', 'ADMINISTRATION', NULL, 5),
  (gen_random_uuid()::text, 'direction', 'Дирекция', 'DIRECTION', NULL, 6)
ON CONFLICT ("code") DO NOTHING;
