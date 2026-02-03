'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadExpenseForm } from '@/components/UploadExpenseForm';

interface Subdivision {
  id: string;
  code?: string | null;
  name: string;
  department: string;
  logisticsStage: string | null;
  sortOrder: number;
}

const ICON_MAP: Record<string, 'truck' | 'warehouse' | 'route' | 'package' | 'building'> = {
  truck: 'truck',
  warehouse: 'warehouse',
  route: 'route',
  package: 'package',
  building: 'building',
};

function guessIcon(name: string): 'truck' | 'warehouse' | 'route' | 'package' | 'building' {
  const n = name.toLowerCase();
  if (n.includes('забор') || n.includes('pickup')) return 'truck';
  if (n.includes('магистраль') || n.includes('mainline')) return 'route';
  if (n.includes('миля') || n.includes('last mile')) return 'package';
  return 'building';
}

export default function UploadExpensesPage() {
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub');
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [subdivisionId, setSubdivisionId] = useState<string>('');
  const scrollYRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/subdivisions')
      .then((r) => r.json())
      .then((data: Subdivision[] | { error?: string }) => {
        const list = Array.isArray(data) ? data : [];
        setSubdivisions(list);
        if (list.length && !subdivisionId) {
          const byCode = subParam ? list.find((s) => s.code === subParam) : null;
          const byId = subParam ? list.find((s) => s.id === subParam) : null;
          const initial = byCode?.id ?? byId?.id ?? list[0].id;
          setSubdivisionId(initial);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (subParam && subdivisions.length) {
      const byCode = subdivisions.find((s) => s.code === subParam);
      const byId = subdivisions.find((s) => s.id === subParam);
      const target = byCode ?? byId;
      if (target) setSubdivisionId(target.id);
    }
  }, [subParam, subdivisions]);

  const sub = subdivisions.find((s) => s.id === subdivisionId);

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    scrollYRef.current = window.scrollY;
    setSubdivisionId(e.target.value);
  };

  useEffect(() => {
    if (scrollYRef.current != null) {
      const y = scrollYRef.current;
      scrollYRef.current = null;
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [subdivisionId]);

  const subdivisionSelect = (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      Подразделение
      <select
        value={subdivisionId}
        onChange={handleSubdivisionChange}
        className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white min-w-[220px]"
      >
        {subdivisions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );

  if (loading) return <div className="animate-pulse text-slate-500 p-6">Загрузка...</div>;
  if (!sub && subdivisions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Расходы</h1>
          <p className="text-slate-500">Нет подразделений. Добавьте их в <a href="/references/subdivisions" className="text-primary-600 underline">справочник подразделений</a>.</p>
        </div>
      </div>
    );
  }
  if (!sub) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Расходы</h1>
        <p className="text-slate-500">Ввод затрат по подразделениям</p>
      </div>
      <UploadExpenseForm
        department={sub.department}
        logisticsStage={sub.logisticsStage}
        label={sub.name}
        description={`Расходы по подразделению «${sub.name}»`}
        icon={guessIcon(sub.name)}
        subdivisionSelect={subdivisionSelect}
      />
    </div>
  );
}
