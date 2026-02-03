const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.manualExpense.deleteMany({});
  await prisma.manualRevenue.deleteMany({});
  await prisma.operation.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.creditPayment.deleteMany({});

  console.log('Данные очищены: операции, продажи, кредиты, ручной ввод. Справочники и правила сохранены.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
