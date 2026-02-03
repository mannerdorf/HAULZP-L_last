'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filters } from '@/components/Filters';
import {
  LOGISTICS_STAGE_LABELS,
  DEPARTMENT_LABELS,
  DIRECTION_LABELS,
} from '@/lib/constants';

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₽';
}

export default function PLPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    pnl: {
      revenue: number;
      cogs: number;
      grossProfit: number;
      opex: number;
      ebitda: number;
      capex: number;
      netAfterCapex: number;
      belowEbitda: number;
      creditPayments?: number;
    };
    cogsByStage: { stage: string; amount: number }[];
    opexByDept: { dept: string; amount: number }[];
    revenueByDir: { direction: string; amount: number }[];
  } | null>(null);

  const q = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetch(`/api/pnl?${params}`)
      .then((r) => r.json())
      .then(setData);
  }, [q, searchParams]);

  if (!data) return <div className="animate-pulse">Загрузка...</div>;

  const { pnl, cogsByStage, opexByDept, revenueByDir } = data;
  const stageOrder = ['PICKUP', 'DEPARTURE_WAREHOUSE', 'MAINLINE', 'ARRIVAL_WAREHOUSE', 'LAST_MILE'];
  const cogsMap = Object.fromEntries(cogsByStage.map((c) => [c.stage, c.amount]));
  const totalCogs = cogsByStage.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">P&L отчёт</h1>
        <p className="text-slate-500">Структурированный отчёт о прибылях и убытках</p>
      </div>

      <Filters />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">1. Выручка</h2>
            <div className="space-y-2 pl-4">
              {revenueByDir.map((r) => (
                <div key={r.direction} className="flex justify-between">
                  <span>{DIRECTION_LABELS[r.direction as keyof typeof DIRECTION_LABELS] ?? r.direction}</span>
                  <span>{formatRub(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Итого</span>
                <span>{formatRub(pnl.revenue)}</span>
              </div>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">2. COGS (по этапам)</h2>
            <div className="space-y-2 pl-4">
              {stageOrder.map((stage) => (
                <div key={stage} className="flex justify-between">
                  <span>{LOGISTICS_STAGE_LABELS[stage as keyof typeof LOGISTICS_STAGE_LABELS]}</span>
                  <span>{formatRub(cogsMap[stage] ?? 0)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Итого COGS</span>
                <span>{formatRub(totalCogs)}</span>
              </div>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">3. Валовая прибыль</h2>
            <div className="pl-4">
              <span className="font-semibold">{formatRub(pnl.grossProfit)}</span>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">4. OPEX</h2>
            <div className="space-y-2 pl-4">
              {opexByDept.map((o) => (
                <div key={o.dept} className="flex justify-between">
                  <span>{DEPARTMENT_LABELS[o.dept as keyof typeof DEPARTMENT_LABELS] ?? o.dept}</span>
                  <span>{formatRub(o.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Итого OPEX</span>
                <span>{formatRub(pnl.opex)}</span>
              </div>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">5. EBITDA</h2>
            <div className="pl-4">
              <span className="font-semibold text-emerald-600">{formatRub(pnl.ebitda)}</span>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">6. CAPEX</h2>
            <div className="pl-4">
              <span className="font-semibold">{formatRub(pnl.capex ?? 0)}</span>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">7. Валовая прибыль – OPEX – CAPEX</h2>
            <div className="pl-4">
              <span className="font-semibold">{formatRub(pnl.netAfterCapex ?? 0)}</span>
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-semibold text-slate-800 mb-4">8. Ниже EBITDA</h2>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between">
                <span>Дивиденды</span>
                <span>—</span>
              </div>
              <div className="flex justify-between">
                <span>Кредиты и лизинг</span>
                <span>{formatRub(pnl.creditPayments ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Транзит</span>
                <span>—</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Итого</span>
                <span>{formatRub(pnl.belowEbitda)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
