import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

function parseAmount(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : Math.abs(v);
  if (typeof v === 'string') {
    let s = v.trim().replace(/\s/g, '');
    if (!s) return 0;
    s = s.replace(/,(\d{1,3})$/, '.$1');
    const n = parseFloat(s.replace(/,/g, ''));
    return isNaN(n) ? 0 : Math.abs(n);
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
    const dateCol = findColumn(row, ['дата', 'date']);
    const amountCol = findColumn(row, ['сумма', 'amount', 'стоимость', 'итого']);
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
  const department = formData.get('department') as string;
  const logisticsStage = formData.get('logisticsStage') as string;

  if (!file) return Response.json({ error: 'Файл не выбран' }, { status: 400 });
  if (!department) return Response.json({ error: 'Не указано подразделение' }, { status: 400 });
  if (!logisticsStage) return Response.json({ error: 'Не указан этап логистики' }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][];

  if (!data.length) return Response.json({ error: 'Пустой файл' }, { status: 400 });

  const headerRowIdx = findHeaderRow(data);
  const header = data[headerRowIdx] as unknown[];
  const dataStartIdx = headerRowIdx + 1;

  const dateCol = findColumn(header, ['дата', 'date']);
  const amountCol = findColumn(header, ['сумма', 'amount', 'стоимость', 'итого', 'всего']);
  const descCol = findColumn(header, ['статья', 'описание', 'наименование', 'название', 'услуга', 'description']);
  const counterpartyCol = findColumn(header, ['контрагент', 'поставщик', 'исполнитель', 'counterparty']);

  if (dateCol < 0 || amountCol < 0) {
    return Response.json({ error: 'Не найдены колонки: дата, сумма' }, { status: 400 });
  }

  // Определяем direction на основе department и logisticsStage
  let direction: string | null = null;
  if (department === 'LOGISTICS_MSK') {
    direction = 'MSK_TO_KGD';
  } else if (department === 'LOGISTICS_KGD') {
    direction = 'MSK_TO_KGD'; // КГД получает грузы из МСК
  }

  let created = 0;
  let skipped = 0;

  for (let i = dataStartIdx; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 2) {
      skipped++;
      continue;
    }

    const amountAbs = parseAmount(row[amountCol]);
    if (amountAbs === 0) {
      skipped++;
      continue;
    }

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
    if (!date || isNaN(date.getTime())) {
      skipped++;
      continue;
    }

    const description = descCol >= 0 ? String(row[descCol] ?? '').trim() : '';
    const counterparty = counterpartyCol >= 0 ? String(row[counterpartyCol] ?? '').trim() : '';
    const purpose = description || counterparty || 'Расход';

    await prisma.operation.create({
      data: {
        date,
        counterparty: counterparty || purpose.slice(0, 100),
        purpose,
        amount: -amountAbs, // Расходы всегда отрицательные
        operationType: 'COGS', // Себестоимость
        department,
        logisticsStage,
        direction,
      },
    });
    created++;
  }

  return Response.json({ created, skipped });
}
