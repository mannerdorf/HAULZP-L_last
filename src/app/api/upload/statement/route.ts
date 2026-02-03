import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

function parseAmount(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') {
    let s = v.trim().replace(/\s/g, '');
    if (!s) return 0;
    s = s.replace(/,(\d{1,3})$/, '.$1');
    const n = parseFloat(s.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function findColumn(row: unknown[], keywords: string[]): number {
  for (let i = 0; i < row.length; i++) {
    const cell = String((row[i] ?? '')).toLowerCase();
    if (keywords.some((k) => cell.includes(k))) return i;
  }
  return -1;
}

function findHeaderRow(data: unknown[][]): number {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] as unknown[];
    if (!row?.length) continue;
    const dateCol = findColumn(row, ['дата проведения', 'дата']);
    const amountCol = findColumn(row, ['сумма в валюте счёта', 'сумма', 'amount']);
    if (dateCol >= 0 && amountCol >= 0) return i;
  }
  return 0;
}

function parseDateDDMMYYYY(s: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (!m) return null;
  const [, d, month, y] = m;
  const date = new Date(parseInt(y, 10), parseInt(month, 10) - 1, parseInt(d, 10));
  return isNaN(date.getTime()) ? null : date;
}

export interface StatementCounterpartyRow {
  counterparty: string;
  totalAmount: number;
  count: number;
  accounted: boolean;
}

/** POST: загрузка выписки, только расходные операции, агрегация по контрагенту. */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const month = Number(formData.get('month'));
  const year = Number(formData.get('year'));
  if (!file) return Response.json({ error: 'Нужен файл' }, { status: 400 });
  if (!month || !year) return Response.json({ error: 'Нужен период' }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][];

  if (!data.length) return Response.json({ error: 'Файл пустой' }, { status: 400 });

  const headerRowIdx = findHeaderRow(data);
  const header = data[headerRowIdx] as unknown[];
  const dataStartIdx = headerRowIdx + 1;

  const dateCol = findColumn(header, ['дата проведения', 'дата']);
  const typeCol = findColumn(header, ['тип операции', 'тип']);
  const amountCol = findColumn(header, ['сумма в валюте счёта', 'сумма', 'amount']);
  const purposeCol = findColumn(header, ['назначение платежа', 'назначение', 'описание операции']);
  // Для расхода (дебет) — получатель; fallback — именно «наименование контрагента», не «счёт контрагента»
  const recipientCol = findColumn(header, ['наименование получателя', 'получатель']);
  const counterpartyNameCol = findColumn(header, ['наименование контрагента']);

  if (dateCol < 0 || amountCol < 0) {
    return Response.json({ error: 'Не найдены колонки: дата, сумма' }, { status: 400 });
  }

  const byCounterparty = new Map<string, { totalAmount: number; count: number }>();

  for (let i = dataStartIdx; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 2) continue;

    const typeStr = String(row[typeCol ?? 0] ?? '').trim().toLowerCase();
    const isDebit = typeStr.includes('дебет') || typeStr === 'расход';
    if (!isDebit) continue;

    const amountAbs = parseAmount(row[amountCol]);
    if (amountAbs === 0) continue;

    const purpose = purposeCol >= 0 ? String(row[purposeCol] ?? '').trim() : '';
    let counterparty = '';
    if (recipientCol >= 0) counterparty = String(row[recipientCol] ?? '').trim();
    if (!counterparty && counterpartyNameCol >= 0) counterparty = String(row[counterpartyNameCol] ?? '').trim();
    if (!counterparty) counterparty = purpose.slice(0, 100) || 'Не указан';

    const key = counterparty.trim() || 'Без контрагента';
    const cur = byCounterparty.get(key) ?? { totalAmount: 0, count: 0 };
    byCounterparty.set(key, {
      totalAmount: cur.totalAmount + amountAbs,
      count: cur.count + 1,
    });
  }

  const periodStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const period = new Date(periodStr);

  await prisma.statementExpense.deleteMany({ where: { period } });

  const createData = Array.from(byCounterparty.entries()).map(([counterparty, v]) => ({
    period,
    counterparty,
    totalAmount: v.totalAmount,
    operationsCount: v.count,
    accounted: false,
  }));
  if (createData.length) {
    await prisma.statementExpense.createMany({ data: createData });
  }

  const saved = await prisma.statementExpense.findMany({
    where: { period },
    orderBy: { totalAmount: 'desc' },
    select: { counterparty: true, totalAmount: true, operationsCount: true, accounted: true },
  });

  const byCounterpartyList: StatementCounterpartyRow[] = saved.map((s) => ({
    counterparty: s.counterparty,
    totalAmount: s.totalAmount,
    count: s.operationsCount,
    accounted: s.accounted,
  }));

  return Response.json({ byCounterparty: byCounterpartyList });
}
