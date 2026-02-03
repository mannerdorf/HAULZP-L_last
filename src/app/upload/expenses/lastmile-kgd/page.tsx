import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function LastmileKgdPage() {
  return (
    <UploadExpenseForm
      department="LOGISTICS_KGD"
      logisticsStage="LAST_MILE"
      label="Последняя миля Калининград"
      description="Расходы на доставку до клиента в Калининграде"
      icon="package"
    />
  );
}
