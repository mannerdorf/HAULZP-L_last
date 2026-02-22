'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  FileText,
  Package,
  TrendingUp,
  BarChart3,
  Bell,
  BookOpen,
  FileUp,
  Truck,
  Warehouse,
  Route,
  DollarSign,
  Building2,
  SlidersHorizontal,
  LogOut,
  ExternalLink,
} from 'lucide-react';

const navMain = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pl', label: 'P&L отчёт', icon: FileText },
  { href: '/unit-economics', label: 'Юнит-экономика', icon: TrendingUp },
  { href: '/per-kg', label: '1 кг логистики', icon: BarChart3 },
  { href: '/alerts', label: 'Алерты', icon: Bell },
];

const navIncome = [
  { href: '/references/income', label: 'Справочник доходов', icon: BookOpen },
  { href: '/upload/sales', label: 'Доходы', icon: DollarSign },
];

const navExpensesRef = [
  { href: '/references/expenses', label: 'Справочник расходов', icon: BookOpen },
  { href: '/upload/statement', label: 'Загрузка выписки', icon: FileUp },
  { href: '/upload/expenses', label: 'Расходы', icon: Truck },
];

function normalizeUrl(raw?: string): string {
  const value = (raw || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const appUrl = useMemo(() => {
    const envUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
    return envUrl || '/login';
  }, []);
  const isExternalApp = useMemo(() => {
    if (!appUrl || typeof window === 'undefined') return false;
    if (!/^https?:\/\//i.test(appUrl)) return false;
    try {
      return new URL(appUrl).origin !== window.location.origin;
    } catch {
      return false;
    }
  }, [appUrl]);
  const navOther = useMemo(
    () => [
      ...(appUrl
        ? [{ href: appUrl, label: 'Приложение (Next.js)', icon: ExternalLink, external: isExternalApp }]
        : []),
      { href: '/references/subdivisions', label: 'Справочник подразделений', icon: Building2, external: false },
      { href: '/settings', label: 'Настройки', icon: SlidersHorizontal, external: false },
    ],
    [appUrl, isExternalApp]
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="font-bold text-lg">P&L + Unit Economics</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navMain.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-slate-700" aria-hidden />
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          Доходы
        </div>
        {navIncome.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-slate-700" aria-hidden />
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          Расходы
        </div>
        {navExpensesRef.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-slate-700" aria-hidden />
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          Прочее
        </div>
        {navOther.map((item) => {
          const Icon = item.icon;
          const active = !item.external && (pathname === item.href || pathname.startsWith(item.href));
          const className = clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            active ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          );
          return item.external ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
