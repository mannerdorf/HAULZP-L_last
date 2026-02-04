import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const department = searchParams.get('department');
  const logisticsStage = searchParams.get('logisticsStage');

  if (!month || !year) return Response.json({ error: 'month, year required' }, { status: 400 });

  // Та же дата, что при сохранении (YYYY-MM-DD → UTC midnight), чтобы совпадать с POST
  const periodStr = `${year}-${String(Number(month)).padStart(2, '0')}-01`;
  const period = new Date(periodStr);

  const [revenues, allExpenses] = await Promise.all([
    prisma.manualRevenue.findMany({
      where: { period },
      include: { category: true },
    }),
    prisma.manualExpense.findMany({
      where: { period },
      include: { category: true },
    }),
  ]);

  let expenses = allExpenses;
  if (department != null) {
    expenses = allExpenses.filter((e) => {
      if (e.category.department !== department) return false;
      if (logisticsStage === '' || logisticsStage === 'null') return e.category.logisticsStage === null;
      return e.category.logisticsStage === logisticsStage;
    });
  }

  return Response.json({
    revenues: revenues.map((r) => ({
      categoryId: r.categoryId,
      amount: r.amount,
      direction: r.direction ?? '',
      transportType: r.transportType ?? '',
    })),
    expenses: expenses.map((e) => ({
      categoryId: e.categoryId,
      categoryName: e.category.name,
      amount: e.amount,
      comment: e.comment ?? null,
      direction: e.direction ?? '',
      transportType: e.transportType ?? '',
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { period, revenues, expenses } = body;
  if (!period) return Response.json({ error: 'period required' }, { status: 400 });

  const periodDate = new Date(period);

  await prisma.$transaction(async (tx) => {
    for (const r of revenues || []) {
      if (!r.categoryId) continue;
      const amount = parseFloat(r.amount) || 0;
      const direction = r.direction != null && typeof r.direction === 'string' ? r.direction.trim() || '' : '';
      const transportType = r.transportType != null && typeof r.transportType === 'string' ? r.transportType.trim() || '' : '';
      if (amount === 0) {
        await tx.manualRevenue.deleteMany({
          where: {
            period: periodDate,
            categoryId: r.categoryId,
            direction,
            transportType,
          },
        });
      } else {
        await tx.manualRevenue.upsert({
          where: {
            period_categoryId_direction_transportType: {
              period: periodDate,
              categoryId: r.categoryId,
              direction,
              transportType,
            },
          },
          create: {
            period: periodDate,
            categoryId: r.categoryId,
            amount,
            direction,
            transportType,
          },
          update: { amount },
        });
      }
    }
    for (const e of expenses || []) {
      if (!e.categoryId) continue;
      const amount = parseFloat(e.amount) || 0;
      const comment = e.comment != null && typeof e.comment === 'string' ? e.comment.trim() || null : null;
      const direction = e.direction != null && typeof e.direction === 'string' ? e.direction.trim() || '' : '';
      const transportType = e.transportType != null && typeof e.transportType === 'string' ? e.transportType.trim() || '' : '';
      if (amount === 0) {
        await tx.manualExpense.deleteMany({
          where: {
            period: periodDate,
            categoryId: e.categoryId,
            direction,
            transportType,
          },
        });
      } else {
        await tx.manualExpense.upsert({
          where: {
            period_categoryId_direction_transportType: {
              period: periodDate,
              categoryId: e.categoryId,
              direction,
              transportType,
            },
          },
          create: {
            period: periodDate,
            categoryId: e.categoryId,
            amount,
            comment,
            direction,
            transportType,
          },
          update: { amount, comment },
        });
      }
    }
  });

  return Response.json({ ok: true });
}
