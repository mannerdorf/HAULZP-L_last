'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';

export default function UploadBankPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/bank', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Загрузка банковской выписки</h1>
        <p className="text-slate-500">XLS / XLSX / CSV — авто-парсинг и классификация</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-xl">
        <div className="space-y-4">
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
              Поддерживаются: дата, контрагент, назначение, сумма
            </p>
          </div>

          {file && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Загрузка...' : 'Загрузить'}
            </button>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 rounded-lg flex items-center gap-3 text-emerald-700">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-medium">Успешно загружено</p>
                <p className="text-sm">Добавлено операций: {result.created}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="font-medium text-slate-700 mb-2">Логика</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Автоопределение колонок по заголовкам</li>
            <li>• Классификация по правилам контрагента</li>
            <li>• Повторные операции — автоматическая классификация</li>
            <li>• Налоги (ЕНС) → OPEX / Администрация</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
