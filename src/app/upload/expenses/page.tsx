'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadExpenseForm } from '@/components/UploadExpenseForm';
import { SUBDIVISIONS } from '@/lib/constants';

const ICON_MAP: Record<string, 'truck' | 'warehouse' | 'route' | 'package' | 'building'> = {
  pickup_msk: 'truck',
  warehouse_msk: 'warehouse',
  mainline: 'route',
  warehouse_kgd: 'warehouse',
  lastmile_kgd: 'package',
  administration: 'building',
  direction: 'building',
};

const VALID_IDS = new Set(SUBDIVISIONS.map((s) => s.id));

export default function UploadExpensesPage() {
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub');
  const initial = subParam && VALID_IDS.has(subParam) ? subParam : 'pickup_msk';
  const [subdivisionId, setSubdivisionId] = useState<string>(initial);

  useEffect(() => {
    if (subParam && VALID_IDS.has(subParam)) setSubdivisionId(subParam);
  }, [subParam]);

  const sub = SUBDIVISIONS.find((s) => s.id === subdivisionId);
  if (!sub) return null;

  const subdivisionSelect = (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      Подразделение
      <select
        value={subdivisionId}
        onChange={(e) => setSubdivisionId(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white min-w-[220px]"
      >
        {SUBDIVISIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Расходы</h1>
        <p className="text-slate-500">Ввод затрат по подразделениям</p>
      </div>
      <UploadExpenseForm
        department={sub.department}
        logisticsStage={sub.logisticsStage}
        label={sub.label}
        description={`Расходы по подразделению «${sub.label}»`}
        icon={ICON_MAP[sub.id] ?? 'building'}
        subdivisionSelect={subdivisionSelect}
      />
    </div>
  );
}
