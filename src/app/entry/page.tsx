'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { DEPARTMENT_LABELS, DIRECTION_LABELS } from '@/lib/constants';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

interface IncomeCat {
  id: string;
  name: string;
  direction: string;
}

interface ExpenseCat {
  id: string;
  name: string;
  department: string;
  type: string;
}

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' ₽';
}

export default function EntryPage() {
  const searchParams = useSearchParams();
  const now = new Date();
  const [month, setMonth] = useState(searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : now.getMonth() + 1);
  const [year, setYear] = useState(searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : now.getFullYear());
  const [incomeCats, setIncomeCats] = useState<IncomeCat[]>([]);
  const [expenseCats, setExpenseCats] = useState<ExpenseCat[]>([]);
  const [revenues, setRevenues] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const period = `${year}-${String(month).padStart(2, '0')}-01`;

  useEffect(() => {
    Promise.all([
      fetch('/api/income-categories').then((r) => r.json()),
      fetch('/api/expense-categories').then((r) => r.json()),
    ]).then(([inc, exp]) => {
      setIncomeCats(inc);
      setExpenseCats(exp);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/manual-entry?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        const rev: Record<string, string> = {};
        (data.revenues || []).forEach((r: { categoryId: string; amount: number }) => {
          rev[r.categoryId] = String(r.amount || '');
        });
        setRevenues(rev);
        const exp: Record<string, string> = {};
        (data.expenses || []).forEach((e: { categoryId: string; amount: number }) => {
          exp[e.categoryId] = String(e.amount || '');
        });
        setExpenses(exp);
      });
  }, [month, year]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenues: incomeCats.map((c) => ({
            categoryId: c.id,
            amount: parseFloat((revenues[c.id] || '0').replace(/\s/g, '').replace(/,/g, '.')) || 0,
          })),
          expenses: expenseCats.map((c) => ({
            categoryId: c.id,
            amount: parseFloat((expenses[c.id] || '0').replace(/\s/g, '').replace(/,/g, '.')) || 0,
          })),
        }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const totalRevenue = Object.values(revenues).reduce((s, v) => s + (parseFloat(v.replace(/\s/g, '').replace(/,/g, '.')) || 0), 0);
  const totalExpense = Object.values(expenses).reduce((s, v) => s + (parseFloat(v.replace(/\s/g, '').replace(/,/g, '.')) || 0), 0);

  const expByDept = expenseCats.reduce((acc, c) => {
    const amt = parseFloat((expenses[c.id] || '0').replace(/\s/g, '').replace(/,/g, '.')) || 0;
    acc[c.department] = (acc[c.department] || 0) + amt;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ручной ввод</h1>
          <p className="text-slate-500">Доходы и расходы за период</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              {[year - 2, year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">Загрузка...</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Доходы</h2>
            <div className="space-y-3">
              {incomeCats.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  <a href="/references/income" className="text-primary-600 underline">Добавьте категории</a> в справочник доходов
                </p>
              ) : (
                incomeCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-4">
                    <label className="flex-1 text-slate-700">
                      {c.name} <span className="text-slate-400 text-sm">({(DIRECTION_LABELS as Record<string, string>)[c.direction]})</span>
                    </label>
                    <input
                      type="text"
                      value={revenues[c.id] ?? ''}
                      onChange={(e) => setRevenues((r) => ({ ...r, [c.id]: e.target.value }))}
                      placeholder="0"
                      className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t font-medium">
              Итого доходы: {formatRub(totalRevenue)}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Расходы по подразделениям</h2>
            <div className="space-y-6">
              {expenseCats.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  <a href="/references/expenses" className="text-primary-600 underline">Добавьте категории</a> в справочник расходов
                </p>
              ) : (
                Object.entries(
                  expenseCats.reduce((acc, c) => {
                    (acc[c.department] = acc[c.department] || []).push(c);
                    return acc;
                  }, {} as Record<string, ExpenseCat[]>)
                ).map(([dept, items]) => (
                  <div key={dept} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="font-medium text-slate-800 mb-2">
                      {(DEPARTMENT_LABELS as Record<string, string>)[dept] ?? dept}
                    </div>
                    <div className="space-y-2">
                      {items.map((c) => (
                        <div key={c.id} className="flex items-center gap-4">
                          <label className="flex-1 text-slate-600 text-sm">{c.name}</label>
                          <input
                            type="text"
                            value={expenses[c.id] ?? ''}
                            onChange={(e) => setExpenses((ex) => ({ ...ex, [c.id]: e.target.value }))}
                            placeholder="0"
                            className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Итого: {formatRub(expByDept[dept] ?? 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t font-medium">
              Итого расходы: {formatRub(totalExpense)}
            </div>
          </div>
        </div>
      )}

      {!loading && (incomeCats.length > 0 || expenseCats.length > 0) && (
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <span className="text-slate-700">Итог за период: </span>
          <span className={`font-semibold ${totalRevenue - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatRub(totalRevenue - totalExpense)}
          </span>
        </div>
      )}
    </div>
  );
}
