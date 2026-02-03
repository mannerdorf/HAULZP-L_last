import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const type = searchParams.get('type');

  const payments = await prisma.creditPayment.findMany({
    where: {
      ...(from && { date: { gte: new Date(from) } }),
      ...(to && { date: { lte: new Date(to) } }),
      ...(type && type !== 'all' && { type }),
    },
    orderBy: { date: 'desc' },
  });
  return Response.json(payments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payment = await prisma.creditPayment.create({
    data: {
      date: new Date(body.date),
      counterparty: body.counterparty,
      purpose: body.purpose || null,
      amount: Number(body.amount),
      type: body.type === 'LEASING' ? 'LEASING' : 'CREDIT',
    },
  });
  return Response.json(payment);
}
