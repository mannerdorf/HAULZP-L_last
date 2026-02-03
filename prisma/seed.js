const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.operation.createMany({
    data: [
      { date: thisMonth, counterparty: 'Клиент А', purpose: 'Доставка МСК-КГД', amount: 150000, operationType: 'REVENUE', department: 'LOGISTICS_MSK', direction: 'MSK_TO_KGD' },
      { date: thisMonth, counterparty: 'Клиент Б', purpose: 'Доставка КГД-МСК', amount: 80000, operationType: 'REVENUE', department: 'LOGISTICS_KGD', direction: 'KGD_TO_MSK' },
      { date: thisMonth, counterparty: 'ТК Деловые линии', purpose: 'Магистраль', amount: -45000, operationType: 'COGS', department: 'LOGISTICS_MSK', logisticsStage: 'MAINLINE', direction: 'MSK_TO_KGD' },
      { date: thisMonth, counterparty: 'Склад МСК', purpose: 'Услуги склада', amount: -12000, operationType: 'COGS', department: 'LOGISTICS_MSK', logisticsStage: 'DEPARTURE_WAREHOUSE', direction: 'MSK_TO_KGD' },
      { date: thisMonth, counterparty: 'Курьер', purpose: 'Забор', amount: -5000, operationType: 'COGS', department: 'LOGISTICS_MSK', logisticsStage: 'PICKUP', direction: 'MSK_TO_KGD' },
      { date: thisMonth, counterparty: 'Офис', purpose: 'Аренда', amount: -30000, operationType: 'OPEX', department: 'ADMINISTRATION' },
    ],
  });

  await prisma.sale.createMany({
    data: [
      { date: thisMonth, client: 'Клиент А', direction: 'MSK_TO_KGD', weightKg: 500, revenue: 150000 },
      { date: thisMonth, client: 'Клиент Б', direction: 'KGD_TO_MSK', weightKg: 200, revenue: 80000 },
    ],
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
