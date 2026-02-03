import { redirect } from 'next/navigation';

export default function AdministrationPage() {
  redirect('/upload/expenses?sub=administration');
}
