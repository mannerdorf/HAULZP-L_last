import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function DirectionPage() {
  return (
    <UploadExpenseForm
      department="DIRECTION"
      logisticsStage={null}
      label="Дирекция"
      description="Расходы дирекции"
      icon="building"
    />
  );
}
