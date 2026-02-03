import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  if (!month || !year) return Response.json({ error: 'month, year required' }, { status: 400 });

  const period = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);

  const [revenues, expenses] = await Promise.all([
    prisma.manualRevenue.findMany({
      where: { period },
      include: { category: true },
    }),
    prisma.manualExpense.findMany({
      where: { period },
      include: { category: true },
    }),
  ]);

  return Response.json({
    revenues: revenues.map((r) => ({ categoryId: r.categoryId, amount: r.amount })),
    expenses: expenses.map((e) => ({ categoryId: e.categoryId, amount: e.amount })),
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
      if (amount === 0) {
        await tx.manualRevenue.deleteMany({
          where: { period: periodDate, categoryId: r.categoryId },
        });
      } else {
        await tx.manualRevenue.upsert({
          where: {
            period_categoryId: { period: periodDate, categoryId: r.categoryId },
          },
          create: { period: periodDate, categoryId: r.categoryId, amount },
          update: { amount },
        });
      }
    }
    for (const e of expenses || []) {
      if (!e.categoryId) continue;
      const amount = parseFloat(e.amount) || 0;
      if (amount === 0) {
        await tx.manualExpense.deleteMany({
          where: { period: periodDate, categoryId: e.categoryId },
        });
      } else {
        await tx.manualExpense.upsert({
          where: {
            period_categoryId: { period: periodDate, categoryId: e.categoryId },
          },
          create: { period: periodDate, categoryId: e.categoryId, amount },
          update: { amount },
        });
      }
    }
  });

  return Response.json({ ok: true });
}
