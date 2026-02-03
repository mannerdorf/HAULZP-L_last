import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function WarehouseMskPage() {
  return (
    <UploadExpenseForm
      department="LOGISTICS_MSK"
      logisticsStage="DEPARTURE_WAREHOUSE"
      label="Склад Москва"
      description="Расходы склада отправления в Москве"
      icon="warehouse"
    />
  );
}
