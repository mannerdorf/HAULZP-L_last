import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET ?period=YYYY-MM-01 — начальное сальдо на указанный месяц */
export async function GET(req: NextRequest) {
  const periodStr = req.nextUrl.searchParams.get('period');
  if (!periodStr) return Response.json({ error: 'period required (YYYY-MM-01)' }, { status: 400 });

  const period = new Date(periodStr);
  if (isNaN(period.getTime())) return Response.json({ error: 'invalid period' }, { status: 400 });

  const rec = await prisma.openingBalance.findUnique({
    where: { period },
  });
  return Response.json({ amount: rec?.amount ?? null, period: periodStr });
}

/** POST { period, amount } — создать/обновить начальное сальдо */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const periodStr = body.period;
  const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount);

  if (!periodStr) return Response.json({ error: 'period required' }, { status: 400 });
  if (isNaN(amount)) return Response.json({ error: 'amount required (number)' }, { status: 400 });

  const period = new Date(periodStr);
  if (isNaN(period.getTime())) return Response.json({ error: 'invalid period' }, { status: 400 });

  const rec = await prisma.openingBalance.upsert({
    where: { period },
    create: { period, amount },
    update: { amount },
  });
  return Response.json(rec);
}
