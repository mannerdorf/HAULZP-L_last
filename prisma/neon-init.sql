-- Таблицы для Neon (PostgreSQL) — вставьте в SQL Editor: https://console.neon.tech
-- Если таблицы уже есть, выполните один раз или используйте: npx prisma db push

-- CreateTable
CREATE TABLE "Operation" (
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
CREATE TABLE "Sale" (
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
CREATE TABLE "CreditPayment" (
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
CREATE TABLE "IncomeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
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
CREATE TABLE "ManualRevenue" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualExpense" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatementExpense" (
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
CREATE TABLE "ClassificationRule" (
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
CREATE INDEX "Operation_date_idx" ON "Operation"("date");
CREATE INDEX "Operation_operationType_idx" ON "Operation"("operationType");
CREATE INDEX "Operation_department_idx" ON "Operation"("department");
CREATE INDEX "Operation_direction_idx" ON "Operation"("direction");
CREATE INDEX "Sale_date_idx" ON "Sale"("date");
CREATE INDEX "Sale_direction_idx" ON "Sale"("direction");
CREATE INDEX "CreditPayment_date_idx" ON "CreditPayment"("date");
CREATE INDEX "CreditPayment_type_idx" ON "CreditPayment"("type");
CREATE INDEX "ExpenseCategory_department_idx" ON "ExpenseCategory"("department");
CREATE INDEX "ManualRevenue_period_idx" ON "ManualRevenue"("period");
CREATE UNIQUE INDEX "ManualRevenue_period_categoryId_key" ON "ManualRevenue"("period", "categoryId");
CREATE INDEX "ManualExpense_period_idx" ON "ManualExpense"("period");
CREATE UNIQUE INDEX "ManualExpense_period_categoryId_key" ON "ManualExpense"("period", "categoryId");
CREATE INDEX "StatementExpense_period_idx" ON "StatementExpense"("period");
CREATE INDEX "StatementExpense_accounted_idx" ON "StatementExpense"("accounted");
CREATE UNIQUE INDEX "StatementExpense_period_counterparty_key" ON "StatementExpense"("period", "counterparty");
CREATE UNIQUE INDEX "ClassificationRule_counterparty_key" ON "ClassificationRule"("counterparty");

-- AddForeignKey
ALTER TABLE "ManualRevenue" ADD CONSTRAINT "ManualRevenue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IncomeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManualExpense" ADD CONSTRAINT "ManualExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatementExpense" ADD CONSTRAINT "StatementExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
