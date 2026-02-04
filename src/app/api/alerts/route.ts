import { NextRequest } from 'next/server';
import { getPnL, getCogsByStage, getUnitEconomics } from '@/lib/calculations';

const THRESHOLDS = {
  cogsPerKgIncreasePercent: 10,
  mainlineCogsPercent: 60,
  marginPerKgMin: 5,
  overheadPercentMax: 15,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    direction: (searchParams.get('direction') || undefined) as any,
    transportType: searchParams.get('transportType') || undefined,
  };

  const [pnl, cogsByStage, unitEcon] = await Promise.all([
    getPnL(params),
    getCogsByStage(params),
    getUnitEconomics(params),
  ]);

  const alerts: { type: string; message: string; severity: 'warning' | 'error' }[] = [];

  if (unitEcon && unitEcon.weightKg > 0) {
    if (unitEcon.marginPerKg < THRESHOLDS.marginPerKgMin && unitEcon.marginPerKg > 0) {
      alerts.push({
        type: 'margin_per_kg',
        message: `Маржа / кг (${unitEcon.marginPerKg.toFixed(1)} ₽) ниже порога ${THRESHOLDS.marginPerKgMin} ₽`,
        severity: 'warning',
      });
    }
  }

  const totalCogs = cogsByStage.reduce((s, x) => s + x.amount, 0);
  const mainlineCogs = cogsByStage.find((x) => x.stage === 'MAINLINE')?.amount ?? 0;
  if (totalCogs > 0 && (mainlineCogs / totalCogs) * 100 > THRESHOLDS.mainlineCogsPercent) {
    alerts.push({
      type: 'mainline_cogs',
      message: `Магистраль (${((mainlineCogs / totalCogs) * 100).toFixed(0)}%) > ${THRESHOLDS.mainlineCogsPercent}% COGS`,
      severity: 'warning',
    });
  }

  if (pnl.revenue > 0 && (pnl.opex / pnl.revenue) * 100 > THRESHOLDS.overheadPercentMax) {
    alerts.push({
      type: 'overhead',
      message: `Overhead (${((pnl.opex / pnl.revenue) * 100).toFixed(0)}%) > ${THRESHOLDS.overheadPercentMax}% выручки`,
      severity: 'warning',
    });
  }

  return Response.json({ alerts });
}
