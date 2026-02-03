'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  FileText,
  Package,
  TrendingUp,
  BarChart3,
  Bell,
  CreditCard,
  BookOpen,
  FileUp,
  Truck,
  Warehouse,
  Route,
  DollarSign,
  Building2,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';

const navMain = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pl', label: 'P&L отчёт', icon: FileText },
  { href: '/unit-economics', label: 'Юнит-экономика', icon: TrendingUp },
  { href: '/per-kg', label: '1 кг логистики', icon: BarChart3 },
  { href: '/alerts', label: 'Алерты', icon: Bell },
];

const navIncome = [{ href: '/upload/sales', label: 'Доходы', icon: DollarSign }];

const navExpensesRef = [
  { href: '/references/expenses', label: 'Справочник расходов', icon: BookOpen },
  { href: '/upload/statement', label: 'Загрузка выписки', icon: FileUp },
];

const navExpenses = [
  { href: '/upload/expenses/pickup-msk', label: 'Заборная логистика Москва', icon: Truck },
  { href: '/upload/expenses/warehouse-msk', label: 'Склад Москва', icon: Warehouse },
  { href: '/upload/expenses/mainline', label: 'Магистраль', icon: Route },
  { href: '/upload/expenses/warehouse-kgd', label: 'Склад Калининград', icon: Warehouse },
  { href: '/upload/expenses/lastmile-kgd', label: 'Последняя миля Калининград', icon: Package },
  { href: '/upload/expenses/administration', label: 'Администрация', icon: Building2 },
  { href: '/upload/expenses/direction', label: 'Дирекция', icon: Building2 },
];

const navOther = [
  { href: '/credits', label: 'Кредиты', icon: CreditCard },
  { href: '/settings', label: 'Настройки', icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="font-bold text-lg">P&L + Unit Economics</h1>
        <p className="text-xs text-slate-400 mt-1">МСК ↔ КГД</p>
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
          Расходы по подразделениям
        </div>
        {navExpenses.map((item) => {
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
        {navOther.map((item) => {
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
