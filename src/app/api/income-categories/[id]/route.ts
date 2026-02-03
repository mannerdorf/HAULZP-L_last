import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const cat = await prisma.incomeCategory.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.direction != null && { direction: body.direction }),
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
  await prisma.incomeCategory.delete({ where: { id } });
  return Response.json({ ok: true });
}
