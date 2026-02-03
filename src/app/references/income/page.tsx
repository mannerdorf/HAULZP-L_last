'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DIRECTION_LABELS } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
  direction: string;
  sortOrder: number;
}

export default function IncomeRefPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', direction: 'MSK_TO_KGD' });
  const [saving, setSaving] = useState(false);

  const load = () => fetch('/api/income-categories').then((r) => r.json()).then(setCats);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/income-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ name: '', direction: 'MSK_TO_KGD' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, name: string, direction: string) => {
    setSaving(true);
    try {
      await fetch(`/api/income-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, direction }),
      });
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить?')) return;
    await fetch(`/api/income-categories/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Справочник доходов</h1>
        <p className="text-slate-500">Категории для ручного ввода выручки</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm text-slate-600 mb-1">Название</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Перевозки МСК→КГД"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Направление</label>
          <select
            value={form.direction}
            onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
          >
            {Object.entries(DIRECTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Название</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Направление</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>
            ) : (
              cats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  {editing === c.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          defaultValue={c.name}
                          id={`edit-name-${c.id}`}
                          className="border rounded px-2 py-1 text-slate-900 w-full"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select id={`edit-dir-${c.id}`} defaultValue={c.direction} className="border rounded px-2 py-1 text-slate-900">
                          {Object.entries(DIRECTION_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            const name = (document.getElementById(`edit-name-${c.id}`) as HTMLInputElement)?.value;
                            const direction = (document.getElementById(`edit-dir-${c.id}`) as HTMLSelectElement)?.value;
                            if (name) handleUpdate(c.id, name, direction);
                          }}
                          className="text-primary-600 text-sm"
                        >Сохранить</button>
                        <button onClick={() => setEditing(null)} className="text-slate-500 text-sm ml-2">Отмена</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{(DIRECTION_LABELS as Record<string, string>)[c.direction] ?? c.direction}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditing(c.id)} className="p-1 text-slate-500 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
