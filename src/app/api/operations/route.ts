import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const direction = searchParams.get('direction');

  const ops = await prisma.operation.findMany({
    where: {
      ...(from && { date: { gte: new Date(from) } }),
      ...(to && { date: { lte: new Date(to) } }),
      ...(direction && direction !== 'all' && { direction: direction as any }),
    },
    orderBy: { date: 'desc' },
  });
  return Response.json(ops);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const op = await prisma.operation.create({
    data: {
      date: new Date(body.date),
      counterparty: body.counterparty,
      purpose: body.purpose,
      amount: Number(body.amount),
      operationType: body.operationType,
      department: body.department,
      logisticsStage: body.logisticsStage || null,
      direction: body.direction || null,
    },
  });
  return Response.json(op);
}
