'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filters } from '@/components/Filters';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';

interface Alert {
  type: string;
  message: string;
  severity: 'warning' | 'error';
}

export default function AlertsPage() {
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const q = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetch(`/api/alerts?${params}`)
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .finally(() => setLoading(false));
  }, [q, searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Алерты</h1>
        <p className="text-slate-500">Уведомления о превышении порогов</p>
      </div>

      <Filters />

      {loading ? (
        <div className="animate-pulse">Загрузка...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex items-center gap-4">
          <CheckCircle className="w-12 h-12 text-emerald-500 shrink-0" />
          <div>
            <p className="font-medium text-emerald-800">Все показатели в норме</p>
            <p className="text-sm text-emerald-600 mt-1">
              Пороги: себестоимость/кг ↑ &gt;10%, магистраль &gt;60% COGS, маржа/кг &lt;5₽, overhead &gt;15%
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border ${
                a.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 shrink-0 mt-0.5 ${
                  a.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                }`}
              />
              <div>
                <p
                  className={`font-medium ${
                    a.severity === 'error' ? 'text-red-800' : 'text-amber-800'
                  }`}
                >
                  {a.message}
                </p>
                <p className="text-xs text-slate-500 mt-1">Тип: {a.type}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-medium text-slate-700 mb-2">Пороги алертов</h3>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Себестоимость / кг ↑ &gt; X%</li>
          <li>• Магистраль &gt; 60% COGS</li>
          <li>• Маржа / кг ↓ &lt; 5 ₽</li>
          <li>• Overhead &gt; 15% выручки</li>
        </ul>
      </div>
    </div>
  );
}
