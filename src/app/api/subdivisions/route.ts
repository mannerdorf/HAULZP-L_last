import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SUBDIVISIONS = [
  { code: 'pickup_msk', name: 'Заборная логистика Москва', department: 'LOGISTICS_MSK', logisticsStage: 'PICKUP', sortOrder: 0 },
  { code: 'warehouse_msk', name: 'Склад Москва', department: 'LOGISTICS_MSK', logisticsStage: 'DEPARTURE_WAREHOUSE', sortOrder: 1 },
  { code: 'mainline', name: 'Магистраль', department: 'LOGISTICS_MSK', logisticsStage: 'MAINLINE', sortOrder: 2 },
  { code: 'warehouse_kgd', name: 'Склад Калининград', department: 'LOGISTICS_KGD', logisticsStage: 'ARRIVAL_WAREHOUSE', sortOrder: 3 },
  { code: 'lastmile_kgd', name: 'Последняя миля Калининград', department: 'LOGISTICS_KGD', logisticsStage: 'LAST_MILE', sortOrder: 4 },
  { code: 'administration', name: 'Администрация', department: 'ADMINISTRATION', logisticsStage: null, sortOrder: 5 },
  { code: 'direction', name: 'Дирекция', department: 'DIRECTION', logisticsStage: null, sortOrder: 6 },
];

export async function GET() {
  try {
    let list = await prisma.subdivision.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    if (list.length === 0) {
      await prisma.subdivision.createMany({
        data: DEFAULT_SUBDIVISIONS.map((s) => ({
          code: s.code,
          name: s.name,
          department: s.department,
          logisticsStage: s.logisticsStage,
          sortOrder: s.sortOrder,
        })),
      });
      list = await prisma.subdivision.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    }
    return Response.json(list);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
    return Response.json({ error: msg }, { status: 500 });
  }
}

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9а-яё_]/gi, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'sub';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return Response.json({ error: 'Название обязательно' }, { status: 400 });
    }
    const name = body.name.trim();
    const code = body.code?.trim() || slugFromName(name);
    const department = body.department || 'ADMINISTRATION';
    const logisticsStage = body.logisticsStage ?? null;
    const sub = await prisma.subdivision.create({
      data: {
        code: code || null,
        name,
        department,
        logisticsStage,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return Response.json(sub);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
    return Response.json({ error: msg }, { status: 500 });
  }
}
