import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUBDIVISIONS } from '@/lib/constants';

/** Создать статью расхода в справочнике и правило классификации по контрагенту (перенос в подразделение). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { counterparty, name, subdivisionId, type, month, year } = body;

    if (!counterparty || typeof counterparty !== 'string' || !counterparty.trim()) {
      return Response.json({ error: 'Укажите контрагента' }, { status: 400 });
    }
    const nameStr = (name && typeof name === 'string' ? name.trim() : counterparty.trim()) || counterparty.trim();
    const sub = SUBDIVISIONS.find((s) => s.id === subdivisionId);
    if (!sub) {
      return Response.json({ error: 'Укажите подразделение' }, { status: 400 });
    }
    const expenseType = type === 'COGS' || type === 'OPEX' || type === 'CAPEX' ? type : 'OPEX';

    const category = await prisma.expenseCategory.create({
      data: {
        name: nameStr,
        department: sub.department,
        type: expenseType,
        logisticsStage: sub.logisticsStage,
        sortOrder: 0,
      },
    });

    await prisma.classificationRule.upsert({
      where: { counterparty: counterparty.trim() },
      create: {
        counterparty: counterparty.trim(),
        operationType: expenseType,
        department: sub.department,
        logisticsStage: sub.logisticsStage,
      },
      update: {
        operationType: expenseType,
        department: sub.department,
        logisticsStage: sub.logisticsStage,
      },
    });

    if (month && year) {
      const periodStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const period = new Date(periodStr);
      await prisma.statementExpense.updateMany({
        where: { period, counterparty: counterparty.trim() },
        data: { accounted: true, categoryId: category.id },
      });
    }

    return Response.json({ category, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
    return Response.json({ error: msg }, { status: 500 });
  }
}
