# P&L + Unit Economics

Мини-приложение для логистической компании (Москва — Калининград).

## Запуск

```bash
npm install
cp .env.example .env   # заполните DATABASE_URL (Neon или локальный Postgres)
npx prisma db push     # создание таблиц в БД
npm run db:seed        # тестовые данные (опционально)
npm run dev            # http://localhost:3000
```

### База данных (Neon)

1. Создайте проект в [Neon](https://console.neon.tech), скопируйте **Connection string** (лучше **Pooled** для Vercel).
2. В `.env` задайте `DATABASE_URL=postgresql://...?sslmode=require`.
3. В Vercel: **Settings → Environment Variables** → добавьте `DATABASE_URL` для Production/Preview.
4. После первого деплоя выполните миграцию таблиц (один раз): локально с продакшен-URL или через `npx prisma db push`.

## Разделы

1. **Dashboard** — KPI (выручка, COGS, EBITDA, себестоимость 1 кг), графики
2. **P&L отчёт** — структурированный отчёт о прибылях и убытках
3. **Детализация операций** — таблица операций с фильтрами
4. **Загрузка выписки** — XLS/XLSX/CSV банковской выписки (авто-парсинг и классификация)
5. **Загрузка продаж** — файл с дата, клиент, направление, вес (кг), выручка
6. **Юнит-экономика** — себестоимость 1 кг по этапам и подразделениям
7. **1 кг логистики** — дашборд с KPI в пересчёте на 1 кг
8. **Алерты** — уведомления о превышении порогов

## Этапы логистики

- Заборная логистика
- Склад отправления
- Магистраль
- Склад получения
- Последняя миля

## Технологии

- Next.js 14, React, TypeScript
- Tailwind CSS, Recharts
- Prisma, PostgreSQL (Neon)
- xlsx для парсинга Excel/CSV
