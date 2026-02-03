import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function WarehouseKgdPage() {
  return (
    <UploadExpenseForm
      department="LOGISTICS_KGD"
      logisticsStage="ARRIVAL_WAREHOUSE"
      label="Склад Калининград"
      description="Расходы склада получения в Калининграде"
      icon="warehouse"
    />
  );
}
