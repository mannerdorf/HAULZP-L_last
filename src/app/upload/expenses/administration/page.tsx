import { UploadExpenseForm } from '@/components/UploadExpenseForm';

export default function AdministrationPage() {
  return (
    <UploadExpenseForm
      department="ADMINISTRATION"
      logisticsStage={null}
      label="Администрация"
      description="Административные расходы"
      icon="building"
    />
  );
}