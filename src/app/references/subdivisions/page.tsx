'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEPARTMENT_LABELS, LOGISTICS_STAGE_LABELS } from '@/lib/constants';

interface Subdivision {
  id: string;
  code?: string | null;
  name: string;
  department: string;
  logisticsStage: string | null;
  sortOrder: number;
}

export default function SubdivisionsRefPage() {
  const [list, setList] = useState<Subdivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    code: '',
    department: 'LOGISTICS_MSK' as string,
    logisticsStage: '' as string,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch('/api/subdivisions')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setList(data);
        else setList([]);
      });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/subdivisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          department: form.department,
          logisticsStage: form.logisticsStage || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Ошибка ${res.status}`);
        return;
      }
      setForm({ name: '', code: '', department: 'LOGISTICS_MSK', logisticsStage: '' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить подразделение?')) return;
    await fetch(`/api/subdivisions/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Справочник подразделений</h1>
        <p className="text-slate-500">Подразделения для выбора на странице расходов</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="font-medium text-slate-800">Добавить подразделение</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Заборная логистика Москва"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Код (для URL, опц.)</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="pickup_msk"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Отдел</label>
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Этап логистики</label>
            <select
              value={form.logisticsStage}
              onChange={(e) => setForm((f) => ({ ...f, logisticsStage: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              <option value="">— Нет (админ/дирекция) —</option>
              {Object.entries(LOGISTICS_STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500 animate-pulse">Загрузка...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Название</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Код</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Отдел</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Этап логистики</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{s.code ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {(DEPARTMENT_LABELS as Record<string, string>)[s.department] ?? s.department}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.logisticsStage
                      ? (LOGISTICS_STAGE_LABELS as Record<string, string>)[s.logisticsStage] ?? s.logisticsStage
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 text-slate-500 hover:text-red-600"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
