import { NextRequest } from 'next/server';
import {
  getMonthlySeries,
  getCogsByStage,
  getOpexByDepartment,
  getEbitdaByDirection,
} from '@/lib/calculations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    direction: (searchParams.get('direction') || undefined) as any,
    transportType: searchParams.get('transportType') || undefined,
  };

  const [revenueLine, cogsLine, ebitdaLine, netAfterCapexLine, cogsByStage, opexByDept, ebitdaByDir] =
    await Promise.all([
      getMonthlySeries(params, 'revenue'),
      getMonthlySeries(params, 'cogs'),
      getMonthlySeries(params, 'ebitda'),
      getMonthlySeries(params, 'netAfterCapex'),
      getCogsByStage(params),
      getOpexByDepartment(params),
      getEbitdaByDirection(params),
    ]);

  return Response.json({
    revenueLine,
    cogsLine,
    ebitdaLine,
    netAfterCapexLine,
    cogsByStage,
    opexByDept,
    revenueByDir: ebitdaByDir,
  });
}
