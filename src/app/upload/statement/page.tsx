'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Plus, X, Trash2 } from 'lucide-react';
import { SUBDIVISIONS } from '@/lib/constants';

type Row = { counterparty: string; totalAmount: number; count: number };

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₽';
}

export default function UploadStatementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    subdivisionId: 'pickup_msk',
    type: 'OPEX' as string,
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setRows([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/statement', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setRows(data.byCounterparty ?? []);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (row: Row) => {
    setModal(row);
    setForm({
      name: row.counterparty,
      subdivisionId: 'pickup_msk',
      type: 'OPEX',
    });
    setSaveError(null);
  };

  const closeModal = () => {
    setModal(null);
    setSaveError(null);
  };

  const removeRow = (row: Row) => {
    setRows((prev) => prev.filter((r) => r.counterparty !== row.counterparty));
    if (modal?.counterparty === row.counterparty) closeModal();
  };

  const handleCreateInReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/expense-categories/from-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterparty: modal.counterparty,
          name: form.name.trim() || modal.counterparty,
          subdivisionId: form.subdivisionId,
          type: form.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      closeModal();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Загрузка выписки</h1>
        <p className="text-slate-500">
          Загрузите выписку — расходные операции будут сгруппированы по контрагентам. Напротив каждого контрагента можно создать статью расхода в справочнике и привязать к подразделению.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleFile}
            className="hidden"
          />
          <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 font-medium">
            {file ? file.name : 'Выберите файл выписки'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            XLS / XLSX / CSV — учитываются только расходные операции
          </p>
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {loading ? 'Обработка...' : 'Загрузить и сгруппировать'}
          </button>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-700">{error}</div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-700">
            Расходы по контрагентам
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Контрагент</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Сумма</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Операций</th>
                  <th className="px-4 py-3 w-48 text-right text-sm font-medium text-slate-600">Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.counterparty} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-900">{row.counterparty}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatRub(row.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{row.count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                          Создать в справочнике и в подразделение
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(row)}
                          title="Удалить строку"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Создать статью расхода</h2>
              <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Контрагент: <span className="font-medium text-slate-700">{modal.counterparty}</span>
              <br />
              Сумма: {formatRub(modal.totalAmount)} ({modal.count} операций)
            </p>
            <form onSubmit={handleCreateInReference} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название статьи</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={modal.counterparty}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Подразделение</label>
                <select
                  value={form.subdivisionId}
                  onChange={(e) => setForm((f) => ({ ...f, subdivisionId: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                >
                  {SUBDIVISIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Тип расхода</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                >
                  <option value="COGS">COGS</option>
                  <option value="OPEX">OPEX</option>
                  <option value="CAPEX">CAPEX</option>
                </select>
              </div>
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
