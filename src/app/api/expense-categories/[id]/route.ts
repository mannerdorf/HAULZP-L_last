import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const cat = await prisma.expenseCategory.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.department != null && { department: body.department }),
      ...(body.type != null && { type: body.type }),
      ...(body.logisticsStage !== undefined && { logisticsStage: body.logisticsStage || null }),
      ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
    },
  });
  return Response.json(cat);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.expenseCategory.delete({ where: { id } });
  return Response.json({ ok: true });
}
