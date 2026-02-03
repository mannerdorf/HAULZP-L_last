import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function MainlinePage() {
  return (
    <UploadExpenseForm
      department="LOGISTICS_MSK"
      logisticsStage="MAINLINE"
      label="Магистраль"
      description="Расходы на магистральную перевозку МСК-КГД"
      icon="route"
    />
  );
}
