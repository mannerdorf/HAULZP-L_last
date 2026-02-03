import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cats = await prisma.incomeCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return Response.json(cats);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cat = await prisma.incomeCategory.create({
    data: {
      name: body.name,
      direction: body.direction || 'MSK_TO_KGD',
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return Response.json(cat);
}
