import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function PickupMskPage() {
  return (
    <UploadExpenseForm
      department="LOGISTICS_MSK"
      logisticsStage="PICKUP"
      label="Заборная логистика Москва"
      description="Расходы на забор грузов в Москве"
      icon="truck"
    />
  );
}
