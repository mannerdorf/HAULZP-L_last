-- Выполните в SQL Editor Neon (один раз), если таблицы Subdivision ещё нет.
-- После этого подразделения из меню подставятся автоматически при первом заходе на «Расходы» или «Справочник подразделений».

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

-- Вставляем подразделения из меню (как было слева)
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

-- Если таблица уже есть и пустая, используйте только INSERT (без CREATE).
-- Если уже есть строки, INSERT с ON CONFLICT не добавит дубликаты по code (нужен UNIQUE на code).
