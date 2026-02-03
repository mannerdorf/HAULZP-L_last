import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const sub = await prisma.subdivision.update({
    where: { id },
    data: {
      ...(body.code !== undefined && { code: body.code?.trim() || null }),
      ...(body.name != null && { name: body.name }),
      ...(body.department != null && { department: body.department }),
      ...(body.logisticsStage !== undefined && { logisticsStage: body.logisticsStage || null }),
      ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
    },
  });
  return Response.json(sub);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.subdivision.delete({ where: { id } });
  return Response.json({ ok: true });
}
