'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filters } from '@/components/Filters';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LOGISTICS_STAGE_LABELS, DEPARTMENT_LABELS } from '@/lib/constants';

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₽/кг';
}

export default function PerKgPage() {
  const searchParams = useSearchParams();
  const [unitEcon, setUnitEcon] = useState<{
    revenuePerKg: number;
    cogsPerKg: number;
    ebitdaPerKg: number;
    marginPerKg: number;
    cogsByStagePerKg: Record<string, number>;
    cogsByDeptPerKg: Record<string, number>;
  } | null>(null);
  const [monthlyMargin, setMonthlyMargin] = useState<{ month: string; marginPerKg: number }[]>([]);

  const q = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const fetchData = async () => {
      const [ueRes, marginRes] = await Promise.all([
        fetch(`/api/unit-economics?${params}`),
        fetch(`/api/charts/monthly-margin?${params}`),
      ]);
      const ue = await ueRes.json();
      const margin = await marginRes.json();
      setUnitEcon(ue);
      setMonthlyMargin(Array.isArray(margin) ? margin : []);
    };
    fetchData();
  }, [q, searchParams]);

  if (!unitEcon) return <div className="animate-pulse">Загрузка...</div>;

  const stageOrder = ['PICKUP', 'DEPARTURE_WAREHOUSE', 'MAINLINE', 'ARRIVAL_WAREHOUSE', 'LAST_MILE'];
  const stageData = stageOrder
    .filter((s) => (unitEcon.cogsByStagePerKg[s] ?? 0) > 0)
    .map((s) => ({
      name: LOGISTICS_STAGE_LABELS[s as keyof typeof LOGISTICS_STAGE_LABELS],
      value: unitEcon.cogsByStagePerKg[s] ?? 0,
    }));
  const deptData = Object.entries(unitEcon.cogsByDeptPerKg ?? {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: DEPARTMENT_LABELS[k as keyof typeof DEPARTMENT_LABELS] ?? k, value: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Дашборд «1 кг логистики»</h1>
        <p className="text-slate-500">KPI и графики в пересчёте на 1 кг</p>
      </div>

      <Filters />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Доход / кг" value={formatRub(unitEcon.revenuePerKg)} />
        <KpiCard title="COGS / кг" value={formatRub(unitEcon.cogsPerKg)} />
        <KpiCard title="EBITDA / кг" value={formatRub(unitEcon.ebitdaPerKg)} />
        <KpiCard title="Маржа / кг" value={formatRub(unitEcon.marginPerKg)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Себестоимость 1 кг по этапам</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(v) => `${v} ₽`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatRub(v)} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Москва vs КГД (COGS/кг)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${v} ₽`} />
                <Tooltip formatter={(v: number) => formatRub(v)} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {monthlyMargin.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Маржа / кг по месяцам</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v} ₽`} />
                <Tooltip formatter={(v: number) => formatRub(v)} />
                <Line type="monotone" dataKey="marginPerKg" stroke="#3b82f6" strokeWidth={2} name="Маржа/кг" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
