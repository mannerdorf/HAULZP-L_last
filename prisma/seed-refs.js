const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const incCount = await prisma.incomeCategory.count();
  if (incCount === 0) {
    await prisma.incomeCategory.createMany({
      data: [
        { name: 'Перевозки МСК→КГД', direction: 'MSK_TO_KGD', sortOrder: 1 },
        { name: 'Перевозки КГД→МСК', direction: 'KGD_TO_MSK', sortOrder: 2 },
      ],
    });
    console.log('Income categories created');
  }

  const expCount = await prisma.expenseCategory.count();
  if (expCount === 0) {
    await prisma.expenseCategory.createMany({
      data: [
        { name: 'Магистраль', department: 'LOGISTICS_MSK', type: 'COGS', logisticsStage: 'MAINLINE', sortOrder: 1 },
        { name: 'Склад отправления', department: 'LOGISTICS_MSK', type: 'COGS', logisticsStage: 'DEPARTURE_WAREHOUSE', sortOrder: 2 },
        { name: 'Заборная логистика', department: 'LOGISTICS_MSK', type: 'COGS', logisticsStage: 'PICKUP', sortOrder: 3 },
        { name: 'Склад получения', department: 'LOGISTICS_KGD', type: 'COGS', logisticsStage: 'ARRIVAL_WAREHOUSE', sortOrder: 4 },
        { name: 'Последняя миля', department: 'LOGISTICS_KGD', type: 'COGS', logisticsStage: 'LAST_MILE', sortOrder: 5 },
        { name: 'Зарплата', department: 'ADMINISTRATION', type: 'OPEX', sortOrder: 10 },
        { name: 'Аренда', department: 'ADMINISTRATION', type: 'OPEX', sortOrder: 11 },
        { name: 'Прочее', department: 'GENERAL', type: 'OPEX', sortOrder: 20 },
      ],
    });
    console.log('Expense categories created');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
