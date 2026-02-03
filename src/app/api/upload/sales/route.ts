import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

function findColumn(row: unknown[], keywords: string[]): number {
  for (let i = 0; i < row.length; i++) {
    const cell = String((row[i] ?? '')).toLowerCase();
    if (keywords.some((k) => cell.includes(k))) return i;
  }
  return -1;
}

function parseNum(v: unknown): number {
  const s = String(v ?? '0').replace(/\s/g, '').replace(/,/g, '');
  return parseFloat(s) || 0;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const month = parseInt(String(formData.get('month') ?? '1'), 10);
  const year = parseInt(String(formData.get('year') ?? new Date().getFullYear()), 10);

  if (!file) return Response.json({ error: 'No file' }, { status: 400 });

  const date = new Date(year, month - 1, 1);

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  if (!data.length) return Response.json({ error: 'Empty file' }, { status: 400 });

  const header = data[0] as unknown[];
  const clientCol = findColumn(header, ['заказчик', 'клиент', 'client']) >= 0 ? findColumn(header, ['заказчик', 'клиент', 'client']) : 0;
  const toKgdCol = findColumn(header, ['калининград', 'кгд', 'в кгд']) >= 0 ? findColumn(header, ['калининград', 'кгд', 'в кгд']) : 1;
  const toMskCol = findColumn(header, ['москва', 'мск', 'mow', 'в мск']) >= 0 ? findColumn(header, ['москва', 'мск', 'mow', 'в мск']) : 2;
  const sumCol = findColumn(header, ['итого', 'сумма', 'sum', 'total']) >= 0 ? findColumn(header, ['итого', 'сумма', 'sum', 'total']) : 3;

  const created: string[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 2) continue;

    const client = String(row[clientCol] ?? '').trim();
    const revKgd = parseNum(row[toKgdCol]); // выручка в КГД (МСК→КГД)
    const revMsk = parseNum(row[toMskCol]); // выручка в МСК (КГД→МСК)
    const total = parseNum(row[sumCol]);

    if (!client && revKgd === 0 && revMsk === 0 && total === 0) continue;
    if (!client) continue;

    if (revKgd > 0) {
      const s = await prisma.sale.create({
        data: { date, client, direction: 'MSK_TO_KGD', weightKg: 0, revenue: revKgd },
      });
      created.push(s.id);
      await prisma.operation.create({
        data: {
          date,
          counterparty: client,
          purpose: `Продажи МСК→КГД`,
          amount: revKgd,
          operationType: 'REVENUE',
          department: 'LOGISTICS_MSK',
          direction: 'MSK_TO_KGD',
        },
      });
    }
    if (revMsk > 0) {
      const s = await prisma.sale.create({
        data: { date, client, direction: 'KGD_TO_MSK', weightKg: 0, revenue: revMsk },
      });
      created.push(s.id);
      await prisma.operation.create({
        data: {
          date,
          counterparty: client,
          purpose: `Продажи КГД→МСК`,
          amount: revMsk,
          operationType: 'REVENUE',
          department: 'LOGISTICS_KGD',
          direction: 'KGD_TO_MSK',
        },
      });
    }
  }

  return Response.json({ created: created.length });
}
