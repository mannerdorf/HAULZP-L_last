import { redirect } from 'next/navigation';

export default function PickupMskPage() {
  redirect('/upload/expenses?sub=pickup_msk');
}
