import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));
  if (!month || !year) return Response.json({ error: 'Нужен период' }, { status: 400 });

  const periodStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const period = new Date(periodStr);

  const rows = await prisma.statementExpense.findMany({
    where: { period },
    orderBy: { totalAmount: 'desc' },
    select: { counterparty: true, totalAmount: true, operationsCount: true, accounted: true },
  });

  return Response.json({
    byCounterparty: rows.map((r) => ({
      counterparty: r.counterparty,
      totalAmount: r.totalAmount,
      count: r.operationsCount,
      accounted: r.accounted,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { month, year, counterparty, accounted } = body ?? {};
  const m = Number(month);
  const y = Number(year);
  if (!m || !y || !counterparty) {
    return Response.json({ error: 'Нужен период и контрагент' }, { status: 400 });
  }
  const periodStr = `${y}-${String(m).padStart(2, '0')}-01`;
  const period = new Date(periodStr);
  await prisma.statementExpense.updateMany({
    where: { period, counterparty: String(counterparty) },
    data: { accounted: Boolean(accounted) },
  });
  return Response.json({ ok: true });
}
