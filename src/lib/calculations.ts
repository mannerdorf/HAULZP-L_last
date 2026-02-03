import { prisma } from './prisma';
import type { Direction } from './types';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PnLData {
  openingBalance: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  ebitdaPercent: number;
  capex: number;
  netAfterCapex: number;
  belowEbitda: number;
  creditPayments: number;
}

export interface CogsByStage {
  stage: string;
  amount: number;
}

export interface UnitEconomics {
  weightKg: number;
  revenuePerKg: number;
  cogsPerKg: number;
  marginPerKg: number;
  ebitdaPerKg: number;
  cogsByStagePerKg: Record<string, number>;
  cogsByDeptPerKg: Record<string, number>;
}

export interface FilterParams {
  from?: string;
  to?: string;
  direction?: Direction;
}

function parseFilter(params: FilterParams): { dateFrom?: Date; dateTo?: Date; direction?: Direction } {
  return {
    dateFrom: params.from ? new Date(params.from) : undefined,
    dateTo: params.to ? new Date(params.to) : undefined,
    direction: params.direction,
  };
}

async function getOperationsSum(
  type: string,
  filters: { dateFrom?: Date; dateTo?: Date; direction?: Direction }
): Promise<number> {
  const ops = await prisma.operation.findMany({
    where: {
      operationType: type as any,
      ...(filters.dateFrom && { date: { gte: filters.dateFrom } }),
      ...(filters.dateTo && { date: { lte: filters.dateTo } }),
      ...(filters.direction && { direction: filters.direction }),
    },
  });
  return ops.reduce((sum, o) => sum + Math.abs(o.amount), 0);
}

export async function getPnL(params: FilterParams): Promise<PnLData> {
  const f = parseFilter(params);

  const periodForOpening = f.dateFrom ? startOfMonth(f.dateFrom) : undefined;
  const openingRec = periodForOpening
    ? await prisma.openingBalance.findUnique({ where: { period: periodForOpening } }).then((r) => r?.amount ?? 0)
    : 0;

  const [revenueOps, cogsOps, opexOps, capexOps, belowEbitdaOps, creditPayments, manualRevenue, manualCogs, manualOpex, manualCapex] = await Promise.all([
    getOperationsSum('REVENUE', f),
    getOperationsSum('COGS', f),
    getOperationsSum('OPEX', f),
    getOperationsSum('CAPEX', f),
    prisma.operation.findMany({
      where: {
        operationType: { in: ['BELOW_EBITDA_DIVIDENDS', 'BELOW_EBITDA_TRANSIT'] },
        ...(f.dateFrom && { date: { gte: f.dateFrom } }),
        ...(f.dateTo && { date: { lte: f.dateTo } }),
        ...(f.direction && { direction: f.direction }),
      },
    }).then((ops) => ops.reduce((s, o) => s + Math.abs(o.amount), 0)),
    prisma.creditPayment.findMany({
      where: {
        ...(f.dateFrom && { date: { gte: f.dateFrom } }),
        ...(f.dateTo && { date: { lte: f.dateTo } }),
      },
    }).then((payments) => payments.reduce((s, p) => s + Math.abs(p.amount), 0)),
    prisma.manualRevenue.findMany({
      where: {
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
        ...(f.direction && { category: { direction: f.direction } }),
      },
    }).then((r) => r.reduce((s, x) => s + x.amount, 0)),
    prisma.manualExpense.findMany({
      where: {
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
        category: { type: 'COGS' },
      },
    }).then((r) => r.reduce((s, x) => s + x.amount, 0)),
    prisma.manualExpense.findMany({
      where: {
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
        category: { type: 'OPEX' },
      },
    }).then((r) => r.reduce((s, x) => s + x.amount, 0)),
    prisma.manualExpense.findMany({
      where: {
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
        category: { type: 'CAPEX' },
      },
    }).then((r) => r.reduce((s, x) => s + x.amount, 0)),
  ]);

  const revenue = revenueOps + manualRevenue;
  const cogs = cogsOps + manualCogs;
  const opex = opexOps + manualOpex;
  const capex = capexOps + manualCapex;
  const belowEbitda = belowEbitdaOps + creditPayments;

  const grossProfit = revenue - cogs;
  const ebitda = grossProfit - opex;
  const ebitdaPercent = revenue > 0 ? (ebitda / revenue) * 100 : 0;
  const netAfterCapex = ebitda - capex;

  return {
    openingBalance: openingRec,
    revenue,
    cogs,
    grossProfit,
    opex,
    ebitda,
    ebitdaPercent,
    capex,
    netAfterCapex,
    belowEbitda,
    creditPayments,
  };
}

export async function getCogsByStage(params: FilterParams): Promise<CogsByStage[]> {
  const f = parseFilter(params);
  const [ops, manual] = await Promise.all([
    prisma.operation.findMany({
      where: {
        operationType: 'COGS',
        logisticsStage: { not: null },
        ...(f.dateFrom && { date: { gte: f.dateFrom } }),
        ...(f.dateTo && { date: { lte: f.dateTo } }),
        ...(f.direction && { direction: f.direction }),
      },
    }),
    prisma.manualExpense.findMany({
      where: {
        category: { type: 'COGS', logisticsStage: { not: null } },
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
      },
      include: { category: true },
    }),
  ]);

  const byStage: Record<string, number> = {};
  for (const op of ops) {
    if (op.logisticsStage) {
      byStage[op.logisticsStage] = (byStage[op.logisticsStage] || 0) + Math.abs(op.amount);
    }
  }
  for (const m of manual) {
    if (m.category.logisticsStage) {
      byStage[m.category.logisticsStage] = (byStage[m.category.logisticsStage] || 0) + m.amount;
    }
  }
  return Object.entries(byStage).map(([stage, amount]) => ({ stage, amount }));
}

export async function getOpexByDepartment(params: FilterParams): Promise<{ dept: string; amount: number }[]> {
  const f = parseFilter(params);
  const [ops, manual] = await Promise.all([
    prisma.operation.findMany({
      where: {
        operationType: 'OPEX',
        ...(f.dateFrom && { date: { gte: f.dateFrom } }),
        ...(f.dateTo && { date: { lte: f.dateTo } }),
      },
    }),
    prisma.manualExpense.findMany({
      where: {
        category: { type: 'OPEX' },
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
      },
      include: { category: true },
    }),
  ]);

  const byDept: Record<string, number> = {};
  for (const op of ops) {
    byDept[op.department] = (byDept[op.department] || 0) + Math.abs(op.amount);
  }
  for (const m of manual) {
    byDept[m.category.department] = (byDept[m.category.department] || 0) + m.amount;
  }
  return Object.entries(byDept).map(([dept, amount]) => ({ dept, amount }));
}

export async function getRevenueByDirection(params: FilterParams): Promise<{ direction: string; amount: number }[]> {
  const f = parseFilter(params);
  const [ops, manual] = await Promise.all([
    prisma.operation.findMany({
      where: {
        operationType: 'REVENUE',
        direction: { not: null },
        ...(f.dateFrom && { date: { gte: f.dateFrom } }),
        ...(f.dateTo && { date: { lte: f.dateTo } }),
      },
    }),
    prisma.manualRevenue.findMany({
      where: {
        ...(f.dateFrom && { period: { gte: f.dateFrom } }),
        ...(f.dateTo && { period: { lte: f.dateTo } }),
      },
      include: { category: true },
    }),
  ]);

  const byDir: Record<string, number> = {};
  for (const op of ops) {
    if (op.direction) {
      byDir[op.direction] = (byDir[op.direction] || 0) + Math.abs(op.amount);
    }
  }
  for (const m of manual) {
    byDir[m.category.direction] = (byDir[m.category.direction] || 0) + m.amount;
  }
  return Object.entries(byDir).map(([dir, amount]) => ({ direction: dir, amount }));
}

export async function getEbitdaByDirection(params: FilterParams): Promise<{ direction: string; amount: number }[]> {
  const f = parseFilter(params);
  const dirs = ['MSK_TO_KGD', 'KGD_TO_MSK'] as const;
  const result: { direction: string; amount: number }[] = [];
  for (const d of dirs) {
    const [rev, cogs] = await Promise.all([
      getOperationsSum('REVENUE', { ...f, direction: d }),
      getOperationsSum('COGS', { ...f, direction: d }),
    ]);
    const opexAll = await getOperationsSum('OPEX', f);
    const totalRev = await getOperationsSum('REVENUE', f);
    const opexShare = totalRev > 0 ? rev / totalRev : 0;
    const ebitda = rev - cogs - opexAll * opexShare;
    result.push({ direction: d, amount: ebitda });
  }
  return result;
}

export async function getTotalWeightKg(params: FilterParams): Promise<number> {
  const f = parseFilter(params);
  const sales = await prisma.sale.findMany({
    where: {
      ...(f.dateFrom && { date: { gte: f.dateFrom } }),
      ...(f.dateTo && { date: { lte: f.dateTo } }),
      ...(f.direction && { direction: f.direction }),
    },
  });
  return sales.reduce((s, sale) => s + sale.weightKg, 0);
}

export async function getUnitEconomics(params: FilterParams): Promise<UnitEconomics | null> {
  const weightKg = await getTotalWeightKg(params);
  if (weightKg <= 0) return null;

  const pnl = await getPnL(params);
  const cogsByStage = await getCogsByStage(params);

  const cogsByStagePerKg: Record<string, number> = {};
  for (const { stage, amount } of cogsByStage) {
    cogsByStagePerKg[stage] = amount / weightKg;
  }

  const f = parseFilter(params);
  const ops = await prisma.operation.findMany({
    where: {
      operationType: 'COGS',
      ...(f.dateFrom && { date: { gte: f.dateFrom } }),
      ...(f.dateTo && { date: { lte: f.dateTo } }),
      ...(f.direction && { direction: f.direction }),
    },
  });
  const cogsByDeptPerKg: Record<string, number> = {};
  for (const op of ops) {
    cogsByDeptPerKg[op.department] = (cogsByDeptPerKg[op.department] || 0) + Math.abs(op.amount) / weightKg;
  }

  return {
    weightKg,
    revenuePerKg: pnl.revenue / weightKg,
    cogsPerKg: pnl.cogs / weightKg,
    marginPerKg: (pnl.revenue - pnl.cogs) / weightKg,
    ebitdaPerKg: pnl.ebitda / weightKg,
    cogsByStagePerKg,
    cogsByDeptPerKg,
  };
}

export async function getMonthlySeries(
  params: FilterParams,
  metric: 'revenue' | 'cogs' | 'ebitda' | 'netAfterCapex'
): Promise<{ month: string; value: number }[]> {
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : subMonths(to, 11);
  const direction = params.direction;

  const months: { month: string; value: number }[] = [];
  let cur = startOfMonth(from);

  while (cur <= to) {
    const next = endOfMonth(cur);
    const f: FilterParams = {
      from: cur.toISOString(),
      to: next.toISOString(),
      ...(direction && { direction }),
    };
    const pnl = await getPnL(f);
    let val = 0;
    if (metric === 'revenue') val = pnl.revenue;
    else if (metric === 'cogs') val = pnl.cogs;
    else if (metric === 'ebitda') val = pnl.ebitda;
    else if (metric === 'netAfterCapex') val = pnl.netAfterCapex;
    months.push({ month: cur.toISOString().slice(0, 7), value: val });
    cur = startOfMonth(subMonths(next, -1));
  }
  return months;
}

export async function getMonthlyMarginPerKg(
  params: FilterParams
): Promise<{ month: string; marginPerKg: number }[]> {
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : subMonths(to, 11);
  const direction = params.direction;

  const months: { month: string; marginPerKg: number }[] = [];
  let cur = startOfMonth(from);

  while (cur <= to) {
    const next = endOfMonth(cur);
    const f: FilterParams = {
      from: cur.toISOString(),
      to: next.toISOString(),
      ...(direction && { direction }),
    };
    const ue = await getUnitEconomics(f);
    months.push({
      month: cur.toISOString().slice(0, 7),
      marginPerKg: ue ? ue.marginPerKg : 0,
    });
    cur = startOfMonth(subMonths(next, -1));
  }
  return months;
}
