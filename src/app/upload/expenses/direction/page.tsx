import { redirect } from 'next/navigation';

export default function DirectionPage() {
  redirect('/upload/expenses?sub=direction');
}
