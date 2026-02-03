import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const rules = await prisma.classificationRule.findMany();
  return Response.json(rules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rule = await prisma.classificationRule.upsert({
    where: { counterparty: body.counterparty },
    create: {
      counterparty: body.counterparty,
      purposePattern: body.purposePattern || null,
      operationType: body.operationType,
      department: body.department,
      logisticsStage: body.logisticsStage || null,
      direction: body.direction || null,
    },
    update: {
      purposePattern: body.purposePattern || null,
      operationType: body.operationType,
      department: body.department,
      logisticsStage: body.logisticsStage || null,
      direction: body.direction || null,
    },
  });
  return Response.json(rule);
}
