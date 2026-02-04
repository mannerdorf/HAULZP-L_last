'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Truck, Warehouse, Route, Package, Plus, Trash2, Building2 } from 'lucide-react';
import { DIRECTION_LABELS } from '@/lib/constants';

const MAINLINE_DIRECTIONS = ['MSK_TO_KGD', 'KGD_TO_MSK'] as const;
const MAINLINE_TRANSPORT = [
  { value: 'AUTO', label: 'авто' },
  { value: 'FERRY', label: 'паром' },
] as const;

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
  direction: string;
  transportType: string;
}

interface SavedExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  comment?: string | null;
  direction?: string;
  transportType?: string;
}

type Props = {
  department: string;
  logisticsStage?: string | null;
  label: string;
  description: string;
  icon: IconName;
  /** Выпадающий список подразделений (рендерится рядом с периодом) */
  subdivisionSelect?: React.ReactNode;
};

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' ₽';
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function UploadExpenseForm({ department, logisticsStage, label, description, icon, subdivisionSelect }: Props) {
  const Icon = ICONS[icon];
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filteredCats, setFilteredCats] = useState<ExpenseCat[]>([]);
  const isMainline = logisticsStage === 'MAINLINE';
  const [rows, setRows] = useState<ExpenseRow[]>([
    { id: generateId(), categoryId: '', amount: '', direction: 'MSK_TO_KGD', transportType: 'AUTO' },
  ]);
  const [savedExpenses, setSavedExpenses] = useState<SavedExpense[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<{ key: string; value: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ key: string; value: string } | null>(null);

  const rowKey = (e: SavedExpense) =>
    `${e.categoryId}:${e.direction ?? ''}:${e.transportType ?? ''}`;
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

  const dirTransport = (d: string, t: string) =>
    d && t ? `${(DIRECTION_LABELS as Record<string, string>)[d] ?? d} ${t === 'FERRY' ? 'паром' : 'авто'}` : '—';

  const handleUpdateSavedAmount = async (
    categoryId: string,
    newAmount: number,
    comment?: string | null,
    direction = '',
    transportType = ''
  ) => {
    setEditingAmount(null);
    const period = `${year}-${String(month).padStart(2, '0')}-01`;
    try {
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenues: [],
          expenses: [{ categoryId, amount: newAmount, comment: comment ?? undefined, direction, transportType }],
        }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      await loadSavedExpenses();
    } catch {
      await loadSavedExpenses();
    }
  };

  const handleUpdateSavedComment = async (
    categoryId: string,
    newComment: string,
    currentAmount: number,
    direction = '',
    transportType = ''
  ) => {
    const trimmed = newComment.trim();
    setEditingComment(null);
    const match = (x: SavedExpense) =>
      x.categoryId === categoryId &&
      (x.direction ?? '') === direction &&
      (x.transportType ?? '') === transportType;
    setSavedExpenses((prev) =>
      prev.map((x) => (match(x) ? { ...x, comment: trimmed || null } : x))
    );
    const period = `${year}-${String(month).padStart(2, '0')}-01`;
    try {
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenues: [],
          expenses: [
            {
              categoryId,
              amount: currentAmount,
              comment: trimmed || undefined,
              direction,
              transportType,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      await loadSavedExpenses();
    } catch {
      await loadSavedExpenses();
    }
  };

  const handleDeleteSaved = async (
    categoryId: string,
    direction = '',
    transportType = ''
  ) => {
    if (!confirm('Удалить эту запись?')) return;
    const key = `${categoryId}:${direction}:${transportType}`;
    setDeletingId(key);
    try {
      const period = `${year}-${String(month).padStart(2, '0')}-01`;
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenues: [],
          expenses: [{ categoryId, amount: 0, direction, transportType }],
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
    setRows((r) => [
      ...r,
      {
        id: generateId(),
        categoryId: '',
        amount: '',
        direction: 'MSK_TO_KGD',
        transportType: 'AUTO',
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((r) => r.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: 'categoryId' | 'amount' | 'direction' | 'transportType',
    value: string
  ) => {
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
      const expenses = validRows.map((r) => ({
        categoryId: r.categoryId,
        amount: parseFloat(r.amount.replace(/\s/g, '').replace(/,/g, '.')) || 0,
        direction: isMainline ? r.direction : '',
        transportType: isMainline ? r.transportType : '',
      }));
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, revenues: [], expenses }),
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
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {subdivisionSelect}
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

        {catsLoading ? (
          <div className="animate-pulse text-slate-500">Загрузка справочника...</div>
        ) : filteredCats.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Нет статей расходов для этого подразделения.{' '}
            <a href="/references/expenses" className="text-primary-600 underline">Добавьте в справочник</a>
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.categoryId}
                    onChange={(e) => updateRow(row.id, 'categoryId', e.target.value)}
                    className="flex-1 min-w-[140px] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="">— Выберите статью —</option>
                    {filteredCats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {isMainline && (
                    <>
                      <select
                        value={row.direction}
                        onChange={(e) => updateRow(row.id, 'direction', e.target.value)}
                        className="w-[130px] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                        title="Направление"
                      >
                        {MAINLINE_DIRECTIONS.map((d) => (
                          <option key={d} value={d}>{(DIRECTION_LABELS as Record<string, string>)[d]}</option>
                        ))}
                      </select>
                      <select
                        value={row.transportType}
                        onChange={(e) => updateRow(row.id, 'transportType', e.target.value)}
                        className="w-[90px] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                        title="Паром / авто"
                      >
                        {MAINLINE_TRANSPORT.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </>
                  )}
                  <input
                    type="text"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                    placeholder="Сумма"
                    className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-right"
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
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-2 text-left text-sm font-medium text-slate-600">Статья</th>
                  {isMainline && (
                    <th className="px-6 py-2 text-left text-sm font-medium text-slate-600">Направление</th>
                  )}
                  <th className="px-6 py-2 text-right text-sm font-medium text-slate-600">Сумма</th>
                  <th className="px-6 py-2 text-left text-sm font-medium text-slate-600">Комментарий</th>
                  <th className="px-6 py-2 w-12 shrink-0" aria-label="Удалить" />
                </tr>
              </thead>
              <tbody>
                {savedExpenses.map((e) => {
                  const key = rowKey(e);
                  const isEditingAmount = editingAmount?.key === key;
                  const amountDisplayValue = isEditingAmount ? editingAmount.value : String(e.amount);
                  const isEditingComment = editingComment?.key === key;
                  const commentDisplayValue = isEditingComment ? editingComment.value : (e.comment ?? '');
                  const dir = e.direction ?? '';
                  const transport = e.transportType ?? '';
                  return (
                  <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-2 text-slate-900">{e.categoryName}</td>
                    {isMainline && (
                      <td className="px-6 py-2 text-slate-600 text-sm">{dirTransport(dir, transport)}</td>
                    )}
                    <td className="px-6 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountDisplayValue}
                        onChange={(ev) => setEditingAmount({ key, value: ev.target.value })}
                        onFocus={() => setEditingAmount({ key, value: String(e.amount) })}
                        onBlur={(ev) => {
                          const raw = ev.target.value.replace(/\s/g, '').replace(/,/g, '.');
                          const v = parseFloat(raw);
                          if (Number.isFinite(v) && v >= 0 && Math.abs(v - e.amount) > 0.001) {
                            handleUpdateSavedAmount(e.categoryId, v, e.comment, dir, transport);
                          } else {
                            setEditingAmount(null);
                          }
                        }}
                        className="w-28 text-right border border-slate-200 rounded px-2 py-1 text-slate-900 font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={commentDisplayValue}
                        onChange={(ev) => setEditingComment({ key, value: ev.target.value })}
                        onFocus={() => setEditingComment({ key, value: e.comment ?? '' })}
                        onBlur={(ev) => {
                          const v = ev.target.value.trim();
                          const current = (e.comment ?? '').trim();
                          if (v !== current) {
                            handleUpdateSavedComment(e.categoryId, ev.target.value, e.amount, dir, transport);
                          } else {
                            setEditingComment(null);
                          }
                        }}
                        placeholder="Комментарий (сохраняется при уходе)"
                        title="Изменить комментарий"
                        className="w-full min-w-[140px] max-w-[220px] border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-2 w-12 shrink-0 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(e.categoryId, dir, transport)}
                        disabled={deletingId === key}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-50 inline-flex"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
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
