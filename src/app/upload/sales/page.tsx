'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { DIRECTION_LABELS } from '@/lib/constants';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

type Direction = 'MSK_TO_KGD' | 'KGD_TO_MSK';
type TransportType = 'AUTO' | 'FERRY';

interface RowState {
  direction: Direction;
  transportType: TransportType;
  weightKg: string;
  volume: string;
  paidWeightKg: string;
  revenue: string;
}

function rowLabel(direction: string, transportType: string): string {
  const dir = (DIRECTION_LABELS as Record<string, string>)[direction] ?? direction;
  const transport = transportType === 'FERRY' ? 'паром' : 'авто';
  return `${dir} ${transport}`;
}

function parseNum(s: string): number {
  return parseFloat(String(s).replace(/\s/g, '').replace(/,/g, '.')) || 0;
}

export default function UploadSalesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/manual?month=${month}&year=${year}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { rows: [] };
        try {
          return JSON.parse(text);
        } catch {
          return { rows: [] };
        }
      })
      .then((data) => {
        if (data.rows && Array.isArray(data.rows)) {
          setRows(
            data.rows.map((x: { direction: string; transportType: string; weightKg?: number; volume?: number; paidWeightKg?: number; revenue?: number }) => ({
              direction: (x.direction || 'MSK_TO_KGD') as Direction,
              transportType: (x.transportType || 'AUTO') as TransportType,
              weightKg: x.weightKg != null ? String(x.weightKg) : '',
              volume: x.volume != null ? String(x.volume) : '',
              paidWeightKg: x.paidWeightKg != null ? String(x.paidWeightKg) : '',
              revenue: x.revenue != null ? String(x.revenue) : '',
            }))
          );
        }
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [month, year]);

  const updateRow = (index: number, field: keyof RowState, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/sales/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          rows: rows.map((r) => ({
            direction: r.direction,
            transportType: r.transportType,
            weightKg: parseNum(r.weightKg),
            volume: parseNum(r.volume),
            paidWeightKg: parseNum(r.paidWeightKg),
            revenue: parseNum(r.revenue),
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Продажи</h1>
        <p className="text-slate-500">
          Ручной ввод по направлениям и типу перевозки. Направления задаются в{' '}
          <a href="/references/income" className="text-primary-600 underline">Справочнике доходов</a>.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse text-slate-500">Загрузка...</div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            Добавьте категории с направлением и типом перевозки в{' '}
            <a href="/references/income" className="text-primary-600 underline">Справочнике доходов</a>,
            чтобы появились строки для ввода.
          </div>
        ) : (
          <div className="space-y-6">
            {rows.map((row, index) => (
              <div
                key={`${row.direction}-${row.transportType}`}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <h3 className="font-medium text-slate-800 mb-3">{rowLabel(row.direction, row.transportType)}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Вес, кг</label>
                    <input
                      type="text"
                      value={row.weightKg}
                      onChange={(e) => updateRow(index, 'weightKg', e.target.value)}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Объём</label>
                    <input
                      type="text"
                      value={row.volume}
                      onChange={(e) => updateRow(index, 'volume', e.target.value)}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Платный вес, кг</label>
                    <input
                      type="text"
                      value={row.paidWeightKg}
                      onChange={(e) => updateRow(index, 'paidWeightKg', e.target.value)}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Итого, ₽</label>
                    <input
                      type="text"
                      value={row.revenue}
                      onChange={(e) => updateRow(index, 'revenue', e.target.value)}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-lg font-semibold text-slate-900">
                Итого: {rows.reduce((s, r) => s + parseNum(r.revenue), 0).toLocaleString('ru-RU')} ₽
              </div>
              <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              {saved && (
                <span className="flex items-center gap-2 text-emerald-600 text-sm">
                  <CheckCircle className="w-4 h-4" /> Сохранено
                </span>
              )}
              {error && (
                <span className="text-red-600 text-sm">{error}</span>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
