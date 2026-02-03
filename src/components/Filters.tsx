'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { DIRECTION_LABELS } from '@/lib/constants';
import type { Direction } from '@/lib/types';

const DIRECTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все' },
  ...Object.entries(DIRECTION_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const direction = searchParams.get('direction') ?? 'all';

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  const setDefaultPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    update('from', start.toISOString().slice(0, 10));
    update('to', now.toISOString().slice(0, 10));
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Период с</label>
        <input
          type="date"
          value={from}
          onChange={(e) => update('from', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">по</label>
        <input
          type="date"
          value={to}
          onChange={(e) => update('to', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Направление</label>
        <select
          value={direction}
          onChange={(e) => update('direction', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
        >
          {DIRECTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          onClick={setDefaultPeriod}
          className="px-4 py-2 text-sm text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Текущий месяц
        </button>
      </div>
    </div>
  );
}
