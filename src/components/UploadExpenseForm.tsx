'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Truck, Warehouse, Route, Package, Plus, Trash2, Building2 } from 'lucide-react';

const ICONS = {
  truck: Truck,
  warehouse: Warehouse,
  route: Route,
  package: Package,
  building: Building2,
} as const;

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

type IconName = keyof typeof ICONS;

interface ExpenseCat {
  id: string;
  name: string;
  department: string;
  type: string;
  logisticsStage: string | null;
}

interface ExpenseRow {
  id: string;
  categoryId: string;
  amount: string;
}

interface SavedExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
}

type Props = {
  department: string;
  logisticsStage?: string | null;
  label: string;
  description: string;
  icon: IconName;
};

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' ₽';
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function UploadExpenseForm({ department, logisticsStage, label, description, icon }: Props) {
  const Icon = ICONS[icon];
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filteredCats, setFilteredCats] = useState<ExpenseCat[]>([]);
  const [rows, setRows] = useState<ExpenseRow[]>([{ id: generateId(), categoryId: '', amount: '' }]);
  const [savedExpenses, setSavedExpenses] = useState<SavedExpense[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [catsLoading, setCatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSavedLoading(true);
    const stage = logisticsStage == null ? '' : logisticsStage;
    const params = `month=${month}&year=${year}&department=${encodeURIComponent(department)}&logisticsStage=${stage ? encodeURIComponent(stage) : ''}`;
    fetch(`/api/manual-entry?${params}`)
      .then((r) => r.json())
      .then((data: { expenses?: SavedExpense[] }) => {
        setSavedExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      })
      .catch(() => setSavedExpenses([]))
      .finally(() => setSavedLoading(false));
  }, [month, year, department, logisticsStage]);

  const loadSavedExpenses = () => {
    const stage = logisticsStage == null ? '' : logisticsStage;
    const params = `month=${month}&year=${year}&department=${encodeURIComponent(department)}&logisticsStage=${stage ? encodeURIComponent(stage) : ''}`;
    fetch(`/api/manual-entry?${params}`)
      .then((r) => r.json())
      .then((data: { expenses?: SavedExpense[] }) => {
        setSavedExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      })
      .catch(() => setSavedExpenses([]))
      .finally(() => setSavedLoading(false));
  };

  const handleDeleteSaved = async (categoryId: string) => {
    if (!confirm('Удалить эту запись?')) return;
    setDeletingId(categoryId);
    try {
      const period = `${year}-${String(month).padStart(2, '0')}-01`;
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenues: [],
          expenses: [{ categoryId, amount: 0 }],
        }),
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      await loadSavedExpenses();
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetch('/api/expense-categories')
      .then((r) => r.json())
      .then((cats: ExpenseCat[]) => {
        // Фильтруем по department и logisticsStage
        const filtered = cats.filter((c) => {
          if (c.department !== department) return false;
          // Для Администрации logisticsStage = null
          if (logisticsStage === null) return c.logisticsStage === null;
          return c.logisticsStage === logisticsStage;
        });
        setFilteredCats(filtered);
        setCatsLoading(false);
      });
  }, [department, logisticsStage]);

  const addRow = () => {
    setRows((r) => [...r, { id: generateId(), categoryId: '', amount: '' }]);
  };

  const removeRow = (id: string) => {
    setRows((r) => r.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: 'categoryId' | 'amount', value: string) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setSaveSuccess(false);
  };

  const handleSaveExpenses = async () => {
    const validRows = rows.filter((r) => r.categoryId && parseFloat(r.amount.replace(/\s/g, '').replace(/,/g, '.')) > 0);
    if (validRows.length === 0) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const period = `${year}-${String(month).padStart(2, '0')}-01`;
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenues: [],
          expenses: validRows.map((r) => ({
            categoryId: r.categoryId,
            amount: parseFloat(r.amount.replace(/\s/g, '').replace(/,/g, '.')) || 0,
          })),
        }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      setSaveSuccess(true);
      loadSavedExpenses();
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = rows.reduce(
    (s, r) => s + (parseFloat(r.amount.replace(/\s/g, '').replace(/,/g, '.')) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
        </div>
        <p className="text-slate-500">{description}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ввод затрат</h2>
        {catsLoading ? (
          <div className="animate-pulse text-slate-500">Загрузка справочника...</div>
        ) : filteredCats.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Нет статей расходов для этого подразделения.{' '}
            <a href="/references/expenses" className="text-primary-600 underline">Добавьте в справочник</a>
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
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
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-3">
                  <select
                    value={row.categoryId}
                    onChange={(e) => updateRow(row.id, 'categoryId', e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="">— Выберите статью —</option>
                    {filteredCats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                    placeholder="Сумма"
                    className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
                  />
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-2 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Добавить строку
            </button>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="font-medium">Итого: {formatRub(totalExpenses)}</span>
              <button
                onClick={handleSaveExpenses}
                disabled={saving || rows.every((r) => !r.categoryId || !r.amount)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>

            {saveSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <span>Сохранено</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900 px-6 py-4 border-b border-slate-100">
          Сохранённые затраты ({MONTHS[month - 1]} {year})
        </h2>
        {savedLoading ? (
          <div className="px-6 py-6 text-slate-500 animate-pulse">Загрузка...</div>
        ) : savedExpenses.length === 0 ? (
          <div className="px-6 py-6 text-slate-500 text-sm">
            Нет сохранённых затрат за этот период. Введите данные выше и нажмите «Сохранить».
          </div>
        ) : (
          <>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-2 text-left text-sm font-medium text-slate-600">Статья</th>
                  <th className="px-6 py-2 text-right text-sm font-medium text-slate-600">Сумма</th>
                  <th className="px-6 py-2 w-10" aria-label="Удалить" />
                </tr>
              </thead>
              <tbody>
                {savedExpenses.map((e) => (
                  <tr key={e.categoryId} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-2 text-slate-900">{e.categoryName}</td>
                    <td className="px-6 py-2 text-right text-slate-900 font-medium">{formatRub(e.amount)}</td>
                    <td className="px-6 py-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(e.categoryId)}
                        disabled={deletingId === e.categoryId}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex justify-end">
              <span className="font-semibold text-slate-900">
                Итого: {formatRub(savedExpenses.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
