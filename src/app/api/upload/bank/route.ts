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

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return Response.json({ error: 'No file' }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][];

  if (!data.length) return Response.json({ error: 'Empty file' }, { status: 400 });

  const headerRowIdx = findHeaderRow(data);
  const header = data[headerRowIdx] as unknown[];
  const dataStartIdx = headerRowIdx + 1;

  const dateCol = findColumn(header, ['дата проведения', 'дата']);
  const typeCol = findColumn(header, ['тип операции', 'тип']);
  const amountCol = findColumn(header, ['сумма в валюте счёта', 'сумма', 'amount']);
  const purposeCol = findColumn(header, ['назначение платежа', 'назначение', 'описание операции']);
  const payerCol = findColumn(header, ['наименование плательщика', 'плательщик']);
  const recipientCol = findColumn(header, ['наименование получателя', 'получатель']);
  const counterpartyCol = findColumn(header, ['наименование контрагента', 'контрагент']);

  if (dateCol < 0 || amountCol < 0) {
    return Response.json({ error: 'Не найдены колонки: дата, сумма' }, { status: 400 });
  }

  const rules = await prisma.classificationRule.findMany();
  const created: string[] = [];

  for (let i = dataStartIdx; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 6) continue;

    const typeStr = String(row[typeCol] ?? '').trim().toLowerCase();
    const isCredit = typeStr.includes('кредит') || typeStr === 'приход';
    const isDebit = typeStr.includes('дебет') || typeStr === 'расход';

    const amountAbs = parseAmount(row[amountCol]);
    if (amountAbs === 0) continue;

    const amount = isDebit ? -amountAbs : amountAbs;

    const dateVal = row[dateCol];
    let date: Date | null = null;
    if (dateVal instanceof Date) {
      date = isNaN(dateVal.getTime()) ? null : dateVal;
    } else if (typeof dateVal === 'number') {
      const parsed = XLSX.SSF.parse_date_code(dateVal) as { y: number; m: number; d: number };
      date = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else {
      date = parseDateDDMMYYYY(String(dateVal ?? ''));
    }
    if (!date || isNaN(date.getTime())) continue;

    const purpose = purposeCol >= 0 ? String(row[purposeCol] ?? '').trim() : '';
    let counterparty = '';
    if (isCredit && payerCol >= 0) {
      counterparty = String(row[payerCol] ?? '').trim();
    } else if (isDebit && recipientCol >= 0) {
      counterparty = String(row[recipientCol] ?? '').trim();
    }
    if (!counterparty && counterpartyCol >= 0) {
      counterparty = String(row[counterpartyCol] ?? '').trim();
    }
    if (!counterparty) counterparty = purpose.slice(0, 100) || 'Не указан';

    const rule = rules.find(
      (r) =>
        counterparty.toLowerCase().includes(r.counterparty.toLowerCase()) ||
        r.counterparty.toLowerCase().includes(counterparty.toLowerCase())
    );

    await prisma.operation.create({
      data: {
        date,
        counterparty,
        purpose: purpose || counterparty,
        amount,
        operationType: rule?.operationType ?? 'OPEX',
        department: rule?.department ?? 'GENERAL',
        logisticsStage: rule?.logisticsStage ?? null,
        direction: rule?.direction ?? null,
      },
    });
    created.push('ok');
  }

  return Response.json({ created: created.length });
}
