'use client';

import { useEffect, useMemo, useState } from 'react';

type MetricConfig = {
  id: string;
  title: string;
  description: string;
  defaultEnabled: boolean;
};

const METRICS: MetricConfig[] = [
  {
    id: 'freeCashFlow',
    title: 'Свободный денежный поток (EBITDA – CAPEX – кредиты)',
    description:
      'Показывает, сколько денег остаётся после операционной прибыли, инвестиций и обязательных платежей. Важно для оценки устойчивости и возможности новых проектов.',
    defaultEnabled: true,
  },
  {
    id: 'opexRatio',
    title: 'OPEX / Выручка',
    description:
      'Доля операционных расходов в выручке. Позволяет отслеживать эффективность и рост постоянных затрат.',
    defaultEnabled: true,
  },
  {
    id: 'capexEfficiency',
    title: 'CAPEX / Выручка',
    description:
      'Отношение капитальных затрат к выручке. Помогает оценить отдачу инвестиций и планировать будущие вложения.',
    defaultEnabled: false,
  },
  {
    id: 'trendDynamics',
    title: 'Δ к предыдущему периоду',
    description:
      'Показывает, как KPI изменился по сравнению с прошлым месяцем/кварталом. Полезно для раннего определения трендов.',
    defaultEnabled: true,
  },
  {
    id: 'unitCapex',
    title: 'CAPEX на 1 кг',
    description:
      'Распределяет капитальные затраты по объёму перевозок. Помогает увидеть реальную себестоимость килограмма с учётом инвестиций.',
    defaultEnabled: false,
  },
  {
    id: 'marginBridge',
    title: 'Маржинальный мост (Выручка → FCF)',
    description:
      'Визуальное представление влияния COGS, OPEX, CAPEX и прочих блоков на конечный денежный поток. Позволяет быстро найти узкие места.',
    defaultEnabled: false,
  },
];

const STORAGE_KEY = 'haulz_metric_settings';

type MetricState = Record<string, boolean>;

function loadInitialState(): MetricState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MetricState;
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export default function SettingsPage() {
  const defaults = useMemo(() => {
    const state: MetricState = {};
    METRICS.forEach((metric) => {
      state[metric.id] = metric.defaultEnabled;
    });
    return state;
  }, []);

  const [metricState, setMetricState] = useState<MetricState>(defaults);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  useEffect(() => {
    const fromStorage = loadInitialState();
    if (Object.keys(fromStorage).length) {
      setMetricState((prev) => ({ ...prev, ...fromStorage }));
    }
    setLoadedFromStorage(true);
  }, []);

  useEffect(() => {
    if (!loadedFromStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metricState));
  }, [loadedFromStorage, metricState]);

  const handleToggle = (id: string, value: boolean) => {
    setMetricState((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Настройки метрик</h1>
        <p className="text-slate-500">
          Управляйте дополнительными показателями. Выбранные метрики будут доступны в отчётах и на дашбордах (после
          внедрения соответствующих виджетов).
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Метрики P&amp;L и дашборда</h2>
        <p className="text-sm text-slate-500 mb-6">
          Включите нужные показатели. Мы сохраняем выбор в браузере, чтобы при следующем входе настройки не потерялись.
        </p>

        <div className="space-y-4">
          {METRICS.map((metric) => (
            <div
              key={metric.id}
              className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between border border-slate-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
            >
              <div className="md:max-w-3xl">
                <h3 className="font-medium text-slate-900">{metric.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{metric.description}</p>
              </div>
              <label className="inline-flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={Boolean(metricState[metric.id])}
                  onChange={(e) => handleToggle(metric.id, e.target.checked)}
                />
                <span className="text-sm text-slate-600">{metricState[metric.id] ? 'Включено' : 'Выключено'}</span>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 text-sm text-slate-500">
        <h3 className="font-semibold text-slate-700 mb-2">Как активируются метрики</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Отметьте нужные показатели выше.</li>
          <li>Дашборд и отчёты используют эти настройки при отображении расширенных KPI.</li>
          <li>Настройки хранятся локально в браузере; при необходимости можно сбросить к значениям по умолчанию.</li>
        </ol>
      </section>
    </div>
  );
}
