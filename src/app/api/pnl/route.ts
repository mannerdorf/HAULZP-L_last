import { NextRequest } from 'next/server';
import { getPnL, getCogsByStage, getOpexByDepartment, getRevenueByDirection } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    direction: (searchParams.get('direction') || undefined) as any,
    transportType: searchParams.get('transportType') || undefined,
  };

  const [pnl, cogsByStage, opexByDept, revenueByDir] = await Promise.all([
    getPnL(params),
    getCogsByStage(params),
    getOpexByDepartment(params),
    getRevenueByDirection(params),
  ]);

  return Response.json({
    pnl,
    cogsByStage,
    opexByDept,
    revenueByDir,
  });
}
