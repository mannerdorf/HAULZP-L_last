import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cats = await prisma.expenseCategory.findMany({
    orderBy: [{ department: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  return Response.json(cats);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cat = await prisma.expenseCategory.create({
    data: {
      name: body.name,
      department: body.department,
      type: body.type || 'OPEX',
      logisticsStage: body.logisticsStage || null,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return Response.json(cat);
}
