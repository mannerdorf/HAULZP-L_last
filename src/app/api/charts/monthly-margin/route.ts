import { NextRequest } from 'next/server';
import { getMonthlyMarginPerKg } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    direction: (searchParams.get('direction') || undefined) as any,
  };
  const data = await getMonthlyMarginPerKg(params);
  return Response.json(data);
}
