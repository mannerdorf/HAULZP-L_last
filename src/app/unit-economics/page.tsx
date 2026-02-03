'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filters } from '@/components/Filters';
import { LOGISTICS_STAGE_LABELS, DEPARTMENT_LABELS } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₽/кг';
}

export default function UnitEconomicsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    weightKg: number;
    revenuePerKg: number;
    cogsPerKg: number;
    marginPerKg: number;
    ebitdaPerKg: number;
    cogsByStagePerKg: Record<string, number>;
    cogsByDeptPerKg: Record<string, number>;
  } | null>(null);

  const q = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetch(`/api/unit-economics?${params}`)
      .then((r) => r.json())
      .then(setData);
  }, [q, searchParams]);

  if (!data) return <div className="animate-pulse">Загрузка...</div>;

  if (data.weightKg <= 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Юнит-экономика</h1>
          <p className="text-slate-500">Себестоимость 1 кг</p>
        </div>
        <Filters />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          Нет данных о весе. Загрузите файл продаж с полем «Вес (кг)».
        </div>
      </div>
    );
  }

  const stageOrder = ['PICKUP', 'DEPARTURE_WAREHOUSE', 'MAINLINE', 'ARRIVAL_WAREHOUSE', 'LAST_MILE'];
  const stageData = stageOrder
    .filter((s) => (data.cogsByStagePerKg[s] ?? 0) > 0)
    .map((s) => ({
      name: LOGISTICS_STAGE_LABELS[s as keyof typeof LOGISTICS_STAGE_LABELS],
      value: data.cogsByStagePerKg[s] ?? 0,
    }));
  const deptData = Object.entries(data.cogsByDeptPerKg)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: DEPARTMENT_LABELS[k as keyof typeof DEPARTMENT_LABELS] ?? k, value: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Юнит-экономика</h1>
        <p className="text-slate-500">Базовая единица: 1 кг обработанного груза</p>
      </div>

      <Filters />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Вес (кг)" value={data.weightKg.toLocaleString('ru-RU')} />
        <KpiCard title="Доход / кг" value={formatRub(data.revenuePerKg)} />
        <KpiCard title="COGS / кг" value={formatRub(data.cogsPerKg)} />
        <KpiCard title="Маржа / кг" value={formatRub(data.marginPerKg)} />
        <KpiCard title="EBITDA / кг" value={formatRub(data.ebitdaPerKg)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Себестоимость 1 кг по этапам</h2>
          <div className="space-y-2">
            {stageOrder.map((s) => (
              <div key={s} className="flex justify-between">
                <span>{LOGISTICS_STAGE_LABELS[s as keyof typeof LOGISTICS_STAGE_LABELS]}</span>
                <span>{formatRub(data.cogsByStagePerKg[s] ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Себестоимость 1 кг по подразделениям</h2>
          <div className="space-y-2">
            {Object.entries(data.cogsByDeptPerKg).map(([dept, val]) => (
              <div key={dept} className="flex justify-between">
                <span>{DEPARTMENT_LABELS[dept as keyof typeof DEPARTMENT_LABELS] ?? dept}</span>
                <span>{formatRub(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stageData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Себестоимость 1 кг по этапам (график)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(v) => `${v} ₽`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatRub(v)} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Полная себестоимость 1 кг (end-to-end)</h2>
        <p className="text-2xl font-bold text-primary-600">{formatRub(data.cogsPerKg)}</p>
      </div>
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
