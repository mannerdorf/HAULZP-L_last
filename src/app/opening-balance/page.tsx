'use client';

import { useState, useEffect } from 'react';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₽';
}

export default function OpeningBalancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodStr = `${year}-${String(month).padStart(2, '0')}-01`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/opening-balance?period=${periodStr}`)
      .then((r) => r.json())
      .then((data) => {
        setAmount(data.amount != null ? String(data.amount) : '');
      })
      .catch(() => setAmount(''))
      .finally(() => setLoading(false));
  }, [periodStr]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(num)) {
      setError('Введите число');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/opening-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: periodStr, amount: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Начальное сальдо</h1>
        <p className="text-slate-500">
          Входящее сальдо на начало месяца. Отрицательное значение — долг или овердрафт.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-md">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Месяц</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Год</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              {[year - 2, year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Сумма (₽)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="-50 000"
              disabled={loading}
              className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900 w-36"
            />
          </div>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-md">
        <h2 className="font-semibold text-slate-800 mb-3">Начальное сальдо в P&L</h2>
        <p className="text-sm text-slate-500">
          При выборе периода в отчёте P&L отображается входящее сальдо на первый день выбранного диапазона (если оно задано).
        </p>
      </div>
    </div>
  );
}
