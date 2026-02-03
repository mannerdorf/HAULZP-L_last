'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filters } from '@/components/Filters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₽';
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [pnl, setPnl] = useState<{
    revenue: number;
    cogs: number;
    grossProfit: number;
    opex: number;
    ebitda: number;
    ebitdaPercent: number;
    capex: number;
    netAfterCapex: number;
    belowEbitda: number;
  } | null>(null);
  const [unitEcon, setUnitEcon] = useState<{ cogsPerKg: number } | null>(null);
  const [charts, setCharts] = useState<{
    revenueLine: { month: string; value: number }[];
    cogsLine: { month: string; value: number }[];
    ebitdaLine: { month: string; value: number }[];
    netAfterCapexLine: { month: string; value: number }[];
    cogsByStage: { stage: string; amount: number }[];
    opexByDept: { dept: string; amount: number }[];
    revenueByDir: { direction: string; amount: number }[];
  } | null>(null);

  const q = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const fetchData = async () => {
      const [pnlRes, unitRes, chartsRes] = await Promise.all([
        fetch(`/api/pnl?${params}`),
        fetch(`/api/unit-economics?${params}`),
        fetch(`/api/charts?${params}`),
      ]);
      const [pnlData, unitData, chartsData] = await Promise.all([
        pnlRes.json(),
        unitRes.json(),
        chartsRes.json(),
      ]);
      setPnl(pnlData.pnl);
      setUnitEcon(unitData);
      setCharts(chartsData);
    };
    fetchData();
  }, [q, searchParams]);

  const lineData =
    charts?.revenueLine?.map((r, i) => ({
      month: r.month,
      Выручка: charts.revenueLine[i]?.value ?? 0,
      COGS: charts.cogsLine[i]?.value ?? 0,
      EBITDA: charts.ebitdaLine[i]?.value ?? 0,
      'Валовая прибыль – OPEX – CAPEX': charts.netAfterCapexLine?.[i]?.value ?? 0,
    })) ?? [];

  const stageLabels: Record<string, string> = {
    PICKUP: 'Забор',
    DEPARTURE_WAREHOUSE: 'Склад отпр.',
    MAINLINE: 'Магистраль',
    ARRIVAL_WAREHOUSE: 'Склад приб.',
    LAST_MILE: 'Последняя миля',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Ключевые показатели и графики</p>
      </div>

      <Filters />

      {pnl && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Выручка" value={formatRub(pnl.revenue)} />
          <KpiCard title="COGS" value={formatRub(pnl.cogs)} />
          <KpiCard title="Валовая прибыль" value={formatRub(pnl.grossProfit)} />
          <KpiCard title="EBITDA" value={formatRub(pnl.ebitda)} />
          <KpiCard title="EBITDA %" value={`${pnl.ebitdaPercent.toFixed(1)}%`} />
          <KpiCard title="CAPEX" value={formatRub(pnl.capex)} />
          <KpiCard title="EBITDA – CAPEX" value={formatRub(pnl.netAfterCapex)} />
          <KpiCard
            title="Себестоимость 1 кг"
            value={unitEcon ? formatRub(unitEcon.cogsPerKg) : '—'}
          />
        </div>
      )}

      {charts && (
        <div className="grid gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-slate-900">Выручка / COGS / EBITDA</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatRub(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="Выручка" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="COGS" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="EBITDA" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Валовая прибыль – OPEX – CAPEX" stroke="#f97316" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-slate-900">COGS по этапам логистики</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      charts.cogsByStage?.map((x) => ({
                        name: stageLabels[x.stage] ?? x.stage,
                        value: x.amount,
                      })) ?? []
                    }
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatRub(v)} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-slate-900">EBITDA по направлениям</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      charts.revenueByDir?.map((x) => ({
                        name: x.direction === 'MSK_TO_KGD' ? 'МСК → КГД' : 'КГД → МСК',
                        value: x.amount,
                      })) ?? []
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatRub(v)} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-slate-900">Структура OPEX</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      charts.opexByDept?.map((x, i) => ({
                        name: x.dept,
                        value: x.amount,
                        fill: COLORS[i % COLORS.length],
                      })) ?? []
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(charts.opexByDept ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatRub(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
