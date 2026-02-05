import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getRowsFromIncomeCategories() {
  const cats = await prisma.incomeCategory.findMany({
    where: {
      direction: { in: ['MSK_TO_KGD', 'KGD_TO_MSK'] },
      transportType: { in: ['AUTO', 'FERRY'] },
    },
    orderBy: [{ direction: 'asc' }, { transportType: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  const seen = new Set<string>();
  const rows: { direction: 'MSK_TO_KGD' | 'KGD_TO_MSK'; transportType: 'AUTO' | 'FERRY'; categoryId: string; name: string }[] = [];
  for (const c of cats) {
    const key = `${c.direction}:${c.transportType}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({
        direction: c.direction as 'MSK_TO_KGD' | 'KGD_TO_MSK',
        transportType: c.transportType as 'AUTO' | 'FERRY',
        categoryId: c.id,
        name: c.name,
      });
    }
  }
  return rows;
}

type ManualSaleRow = {
  direction?: string;
  transportType?: string;
  weightKg?: number | string;
  volume?: number | string;
  paidWeightKg?: number | string;
  revenue?: number | string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  if (!month || !year) return Response.json({ error: 'month, year required' }, { status: 400 });

  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);

  const [rows, sales] = await Promise.all([
    getRowsFromIncomeCategories(),
    prisma.sale.findMany({
      where: { date },
      orderBy: [{ direction: 'asc' }, { transportType: 'asc' }],
    }),
  ]);

  const byKey: Record<string, { weightKg: number; volume: number; paidWeightKg: number; revenue: number }> = {};
  rows.forEach(({ direction, transportType }) => {
    const key = `${direction}:${transportType}`;
    byKey[key] = { weightKg: 0, volume: 0, paidWeightKg: 0, revenue: 0 };
  });
  sales.forEach((s) => {
    const key = `${s.direction}:${s.transportType ?? 'AUTO'}`;
    if (byKey[key]) {
      byKey[key] = {
        weightKg: s.weightKg,
        volume: s.volume ?? 0,
        paidWeightKg: s.paidWeightKg ?? 0,
        revenue: s.revenue,
      };
    }
  });

  return Response.json({
    rows: rows.map(({ direction, transportType, categoryId, name }) => ({
      direction,
      transportType,
      categoryId,
      name,
      ...byKey[`${direction}:${transportType}`],
    })),
  });
}

export async function POST(req: NextRequest) {
  let body: { month?: number; year?: number; rows?: ManualSaleRow[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Неверный формат тела запроса' }, { status: 400 });
  }
  const { month, year, rows } = body;
  if (!month || !year || !Array.isArray(rows)) {
    return Response.json({ error: 'month, year, rows required' }, { status: 400 });
  }

  const date = new Date(Number(year), Number(month) - 1, 1);

  try {
  await prisma.$transaction(async (tx) => {
    await tx.sale.deleteMany({ where: { date } });
    await tx.operation.deleteMany({
      where: {
        date,
        operationType: 'REVENUE',
        purpose: { startsWith: 'Продажи ' },
      },
    });

    for (const r of rows) {
      const direction = r.direction === 'KGD_TO_MSK' ? 'KGD_TO_MSK' : 'MSK_TO_KGD';
      const transportType = r.transportType === 'FERRY' ? 'FERRY' : 'AUTO';
      const weightKg = parseFloat(String(r.weightKg ?? '')) || 0;
      const volume = parseFloat(String(r.volume ?? '')) || 0;
      const paidWeightKg = parseFloat(String(r.paidWeightKg ?? '')) || 0;
      const revenue = parseFloat(String(r.revenue ?? '')) || 0;

      await tx.sale.create({
        data: {
          date,
          client: '—',
          direction,
          transportType,
          weightKg,
          volume: volume || null,
          paidWeightKg: paidWeightKg || null,
          revenue,
        },
      });

      if (revenue > 0) {
        const purpose = direction === 'MSK_TO_KGD' ? 'Продажи МСК→КГД' : 'Продажи КГД→МСК';
        const dept = direction === 'MSK_TO_KGD' ? 'LOGISTICS_MSK' : 'LOGISTICS_KGD';
        await tx.operation.create({
          data: {
            date,
            counterparty: '—',
            purpose: `${purpose} (${transportType === 'FERRY' ? 'паром' : 'авто'})`,
            amount: revenue,
            operationType: 'REVENUE',
            department: dept,
            direction,
          },
        });
      }
    }
  });

  return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
    return Response.json({ error: msg }, { status: 500 });
  }
}
