import { redirect } from 'next/navigation';

export default function WarehouseMskPage() {
  redirect('/upload/expenses?sub=warehouse_msk');
}
