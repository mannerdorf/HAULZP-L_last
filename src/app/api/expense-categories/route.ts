import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cats = await prisma.expenseCategory.findMany({
      orderBy: [{ department: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return Response.json(cats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return Response.json({ error: 'Название обязательно' }, { status: 400 });
    }
    if (!body.department) {
      return Response.json({ error: 'Укажите подразделение' }, { status: 400 });
    }
    const cat = await prisma.expenseCategory.create({
      data: {
        name: body.name.trim(),
        department: body.department,
        type: body.type || 'OPEX',
        logisticsStage: body.logisticsStage ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return Response.json(cat);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
    return Response.json({ error: msg }, { status: 500 });
  }
}
